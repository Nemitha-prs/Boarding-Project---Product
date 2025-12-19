import { Router } from "express";
import { supabase } from "../supabase.js";
import type { ListingRow, OwnerStatus } from "../types/db.js";
import { jwtMiddleware, requireOwner } from "../middleware/auth.js";

const router = Router();

// GET /listings (public) - can filter by ownerId and status query parameters
router.get("/", async (req, res) => {
  const ownerId = req.query.ownerId as string | undefined;
  const status = req.query.status as string | undefined;
  
  // Only select required fields to reduce payload size
  let query = supabase
    .from("listings")
    .select("id, title, description, price, negotiable, boardingType, district, colomboArea, lat, lng, beds, bathrooms, facilities, images, status, createdAt, updatedAt, ownerId")
    .order("createdAt", { ascending: false });
  
  if (ownerId) {
    query = query.eq("ownerId", ownerId);
  }
  
  if (status) {
    query = query.eq("status", status);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching listings:", error);
    return res.status(500).json({ error: error.message });
  }
  
  // Add cache headers for public listings
  res.setHeader("Cache-Control", "public, max-age=60");
  return res.json(data ?? []);
});

// GET /listings/map (public) - minimal data for map view (id, lat, lng only)
router.get("/map", async (req, res) => {
  const status = req.query.status as string | undefined;
  
  let query = supabase
    .from("listings")
    .select("id, title, lat, lng, boardingType, status")
    .not("lat", "is", null)
    .not("lng", "is", null);
  
  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.eq("status", "Active");
  }
  
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching map listings:", error);
    return res.status(500).json({ error: error.message });
  }
  
  // Cache map data longer since it changes less frequently
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.json(data ?? []);
});

// Helper function to convert string ID to numeric (same as frontend)
function stringIdToNumeric(id: string): number {
  let numericId = 0;
  if (id) {
    for (let i = 0; i < id.length; i++) {
      numericId = ((numericId << 5) - numericId) + id.charCodeAt(i);
      numericId = numericId & numericId; // Convert to 32-bit integer
    }
    numericId = Math.abs(numericId);
  }
  return numericId;
}

// GET /listings/by-numeric-id/:numericId (public) - fetch listing by numeric ID
router.get("/by-numeric-id/:numericId", async (req, res) => {
  const numericIdParam = req.params.numericId;
  const numericId = parseInt(numericIdParam, 10);
  
  if (isNaN(numericId)) {
    return res.status(400).json({ error: "Invalid numeric ID" });
  }
  
  // First, fetch only id fields from active listings (much smaller payload)
  const { data: activeListingIds, error: fetchError } = await supabase
    .from("listings")
    .select("id")
    .eq("status", "Active");
  
  if (fetchError) {
    console.error("Error fetching listings:", fetchError);
    return res.status(500).json({ error: fetchError.message });
  }
  
  if (!activeListingIds || activeListingIds.length === 0) {
    return res.status(404).json({ error: "Listing not found" });
  }
  
  // Find the listing ID with matching numeric ID
  const matchingId = activeListingIds.find((listing) => {
    const listingNumericId = stringIdToNumeric(listing.id);
    return listingNumericId === numericId;
  });
  
  if (!matchingId) {
    return res.status(404).json({ error: "Listing not found" });
  }
  
  // Now fetch only the specific listing's full data (select specific fields)
  const { data: matchingListing, error: detailError } = await supabase
    .from("listings")
    .select("id, title, description, price, negotiable, boardingType, district, colomboArea, lat, lng, beds, bathrooms, facilities, images, status, createdAt, updatedAt, ownerId")
    .eq("id", matchingId.id)
    .single();
  
  if (detailError || !matchingListing) {
    console.error("Error fetching listing details:", detailError);
    return res.status(404).json({ error: "Listing not found" });
  }
  
  // Fetch owner info for contact details
  if (matchingListing.ownerId) {
    const { data: owner, error: ownerError } = await supabase
      .from("users")
      .select("id, name, phone, email")
      .eq("id", matchingListing.ownerId)
      .single();
    if (!ownerError && owner) {
      // Cache individual listings for 60 seconds
      res.setHeader("Cache-Control", "public, max-age=60");
      return res.json({ ...matchingListing, owner });
    }
  }
  
  res.setHeader("Cache-Control", "public, max-age=60");
  return res.json(matchingListing);
});

// POST /listings/:id/increment-pending-approvals (public) - MUST be before /:id route
router.post("/:id/increment-pending-approvals", async (req, res) => {
  const id = req.params.id;

  // Use atomic RPC function for increment (most reliable, prevents race conditions)
  const { data: rpcData, error: rpcError } = await supabase.rpc('increment_pending_approvals', { listing_id: id });
  
  if (!rpcError && rpcData !== null && rpcData !== undefined) {
    return res.json({ pendingApprovals: typeof rpcData === 'number' ? rpcData : (rpcData as any).pendingApprovals || 0 });
  }
  
  // Fallback: if RPC function doesn't exist, return error since column doesn't exist
  if (rpcError && (rpcError.message?.includes('function') || rpcError.message?.includes('does not exist'))) {
    // Column doesn't exist, return 0 as default
    return res.json({ pendingApprovals: 0 });
  }
  
  // Handle other RPC errors
  if (rpcError) {
    if (rpcError.message?.includes("Listing not found")) {
      return res.status(404).json({ error: "Listing not found" });
    }
    return res.status(500).json({ error: rpcError.message || "Failed to increment pending approvals" });
  }
  
  return res.json({ pendingApprovals: 0 });
});

// GET /listings/:id (public)
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  // Select only required fields
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, description, price, negotiable, boardingType, district, colomboArea, lat, lng, beds, bathrooms, facilities, images, status, createdAt, updatedAt, ownerId")
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: "Listing not found" });
  
  // Also fetch owner info for contact details
  if (data?.ownerId) {
    const { data: owner, error: ownerError } = await supabase
      .from("users")
      .select("id, name, phone, email")
      .eq("id", data.ownerId)
      .single();
    if (!ownerError && owner) {
      res.setHeader("Cache-Control", "public, max-age=60");
      return res.json({ ...data, owner });
    }
  }
  
  res.setHeader("Cache-Control", "public, max-age=60");
  return res.json(data);
});

// POST /listings (owner only)
router.post("/", jwtMiddleware, requireOwner, async (req, res) => {
  const body = req.body as Partial<ListingRow>;
  // Basic MVP validation
  const required: Array<keyof ListingRow> = [
    "title",
    "description",
    "price",
    "negotiable",
    "boardingType",
    "district",
    "bathrooms",
    "facilities",
    "images",
  ];
  for (const key of required) {
    if ((body as any)[key] === undefined || (body as any)[key] === null) {
      if (key === "images") {
        return res.status(400).json({ error: "At least one image is required" });
      }
      return res.status(400).json({ error: `${key} is required` });
    }
  }

  // Validate images array
  if (!Array.isArray(body.images) || body.images.length === 0) {
    return res.status(400).json({ error: "At least one image is required" });
  }
  
  // Validate image data URLs (basic check)
  const maxImageSize = 10 * 1024 * 1024; // 10 MB per image (base64 is ~33% larger than original)
  for (let i = 0; i < body.images.length; i++) {
    const image = body.images[i];
    if (typeof image !== "string") {
      return res.status(400).json({ error: `Image ${i + 1} is invalid. Please upload a valid image file.` });
    }
    if (!image.startsWith("data:image/")) {
      return res.status(400).json({ error: `Image ${i + 1} format is invalid. Please use JPG, PNG, or WebP.` });
    }
    // Check approximate size (base64 string length is roughly 4/3 of original size)
    if (image.length > maxImageSize) {
      return res.status(400).json({ error: `Image ${i + 1} is too large. Maximum size is 5 MB per image.` });
    }
  }

  const now = new Date().toISOString();
  const insert: Partial<ListingRow> = {
    title: body.title!,
    description: body.description!,
    price: Number(body.price!),
    negotiable: Boolean(body.negotiable),
    boardingType: String(body.boardingType!),
    district: String(body.district!),
    colomboArea: body.colomboArea ?? null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    beds: body.beds ?? null,
    bathrooms: Number(body.bathrooms!),
    facilities: Array.isArray(body.facilities) ? body.facilities : [],
    images: Array.isArray(body.images) ? body.images : [],
    rating: typeof body.rating === "number" ? body.rating : 0,
    status: (body.status as OwnerStatus) ?? "Active",
    ownerId: (req.user as any).id,
    createdAt: now,
    updatedAt: now,
  };

  const { data, error } = await supabase.from("listings").insert(insert).select("id, title, description, price, negotiable, boardingType, district, colomboArea, lat, lng, beds, bathrooms, facilities, images, status, createdAt, updatedAt, ownerId").single();
  if (error) {
    // Handle Supabase-specific errors
    const errorMessage = error.message?.toLowerCase() || "";
    if (errorMessage.includes("storage") || errorMessage.includes("bucket") || errorMessage.includes("supabase")) {
      console.error("Supabase storage error:", error);
      return res.status(500).json({ error: "Image upload service error. Please try again in a moment." });
    }
    if (errorMessage.includes("size") || errorMessage.includes("large") || errorMessage.includes("limit")) {
      return res.status(400).json({ error: "Image is too large. Please use images smaller than 5 MB." });
    }
    console.error("Database error:", error);
    return res.status(500).json({ error: "Failed to save listing. Please try again." });
  }
  return res.status(201).json(data);
});

// PATCH /listings/:id (owner only) - full update
router.patch("/:id", jwtMiddleware, requireOwner, async (req, res) => {
  const id = req.params.id;
  const body = req.body as Partial<ListingRow>;

  // Ensure the listing belongs to the owner
  const { data: listing, error: getErr } = await supabase
    .from("listings")
    .select("id, ownerId")
    .eq("id", id)
    .single();
  if (getErr || !listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.ownerId !== (req.user as any).id) return res.status(403).json({ error: "Not your listing" });

  const update: Partial<ListingRow> = {
    updatedAt: new Date().toISOString(),
  };

  // Only update fields that are provided
  if (body.title !== undefined) update.title = String(body.title);
  if (body.description !== undefined) update.description = String(body.description);
  if (body.price !== undefined) update.price = Number(body.price);
  if (body.negotiable !== undefined) update.negotiable = Boolean(body.negotiable);
  if (body.boardingType !== undefined) update.boardingType = String(body.boardingType);
  if (body.district !== undefined) update.district = String(body.district);
  if (body.colomboArea !== undefined) update.colomboArea = body.colomboArea;
  if (body.lat !== undefined) update.lat = body.lat;
  if (body.lng !== undefined) update.lng = body.lng;
  if (body.beds !== undefined) update.beds = body.beds;
  if (body.bathrooms !== undefined) update.bathrooms = Number(body.bathrooms);
  if (body.facilities !== undefined) update.facilities = Array.isArray(body.facilities) ? body.facilities : [];
  if (body.images !== undefined) {
    // Validate images array if provided
    if (!Array.isArray(body.images)) {
      return res.status(400).json({ error: "Images must be an array" });
    }
    if (body.images.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }
    
    // Validate image data URLs
    const maxImageSize = 10 * 1024 * 1024; // 10 MB per image (base64)
    for (let i = 0; i < body.images.length; i++) {
      const image = body.images[i];
      if (typeof image !== "string") {
        return res.status(400).json({ error: `Image ${i + 1} is invalid. Please upload a valid image file.` });
      }
      if (!image.startsWith("data:image/")) {
        return res.status(400).json({ error: `Image ${i + 1} format is invalid. Please use JPG, PNG, or WebP.` });
      }
      if (image.length > maxImageSize) {
        return res.status(400).json({ error: `Image ${i + 1} is too large. Maximum size is 5 MB per image.` });
      }
    }
    
    update.images = body.images;
  }
  if (body.status !== undefined) update.status = body.status as OwnerStatus;

  const { data, error } = await supabase
    .from("listings")
    .update(update)
    .eq("id", id)
    .select("id, title, description, price, negotiable, boardingType, district, colomboArea, lat, lng, beds, bathrooms, facilities, images, status, createdAt, updatedAt, ownerId")
    .single();
  if (error) {
    // Handle Supabase-specific errors
    const errorMessage = error.message?.toLowerCase() || "";
    if (errorMessage.includes("storage") || errorMessage.includes("bucket") || errorMessage.includes("supabase")) {
      console.error("Supabase storage error:", error);
      return res.status(500).json({ error: "Image upload service error. Please try again in a moment." });
    }
    if (errorMessage.includes("size") || errorMessage.includes("large") || errorMessage.includes("limit")) {
      return res.status(400).json({ error: "Image is too large. Please use images smaller than 5 MB." });
    }
    console.error("Database error:", error);
    return res.status(500).json({ error: "Failed to update listing. Please try again." });
  }
  return res.json(data);
});

// PATCH /listings/:id/status (owner only)
router.patch("/:id/status", jwtMiddleware, requireOwner, async (req, res) => {
  const id = req.params.id;
  const { status } = req.body as { status?: OwnerStatus };
  if (!status || (status !== "Active" && status !== "Not-active")) {
    return res.status(400).json({ error: "status must be 'Active' or 'Not-active'" });
  }

  // Ensure the listing belongs to the owner
  const { data: listing, error: getErr } = await supabase
    .from("listings")
    .select("id, ownerId")
    .eq("id", id)
    .single();
  if (getErr || !listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.ownerId !== (req.user as any).id) return res.status(403).json({ error: "Not your listing" });

  const { data, error } = await supabase
    .from("listings")
    .update({ status, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select("id, title, description, price, negotiable, boardingType, district, colomboArea, lat, lng, beds, bathrooms, facilities, images, status, createdAt, updatedAt, ownerId")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /listings/:id (owner only) - permanently delete listing
router.delete("/:id", jwtMiddleware, requireOwner, async (req, res) => {
  const id = req.params.id;

  // Ensure the listing exists and belongs to the owner
  const { data: listing, error: getErr } = await supabase
    .from("listings")
    .select("id, ownerId")
    .eq("id", id)
    .single();
  if (getErr || !listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.ownerId !== (req.user as any).id) return res.status(403).json({ error: "Not your listing" });

  // Permanently delete the listing
  const { error: deleteError } = await supabase
    .from("listings")
    .delete()
    .eq("id", id);
  if (deleteError) return res.status(500).json({ error: deleteError.message });
  
  // Return 204 No Content on successful deletion
  return res.status(204).send();
});

export default router;
