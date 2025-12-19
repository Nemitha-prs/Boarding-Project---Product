import { Router } from "express";
import { supabase } from "../supabase";
import type { ListingRow, OwnerStatus } from "../types/db";
import { jwtMiddleware, requireOwner } from "../middleware/auth";

const router = Router();

// GET /listings (public) - can filter by ownerId query parameter
router.get("/", async (req, res) => {
  const ownerId = req.query.ownerId as string | undefined;
  
  let query = supabase
    .from("listings")
    .select("*")
    .order("createdAt", { ascending: false });
  
  if (ownerId) {
    query = query.eq("ownerId", ownerId);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching listings:", error);
    return res.status(500).json({ error: error.message });
  }
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
  
  // Fetch all active listings
  const { data: allListings, error: fetchError } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "Active");
  
  if (fetchError) {
    console.error("Error fetching listings:", fetchError);
    return res.status(500).json({ error: fetchError.message });
  }
  
  if (!allListings || allListings.length === 0) {
    return res.status(404).json({ error: "Listing not found" });
  }
  
  // Find the listing with matching numeric ID
  const matchingListing = allListings.find((listing) => {
    const listingNumericId = stringIdToNumeric(listing.id);
    return listingNumericId === numericId;
  });
  
  if (!matchingListing) {
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
      return res.json({ ...matchingListing, owner });
    }
  }
  
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
  
  // Fallback: if RPC function doesn't exist, use two-step approach (less ideal but works)
  // This has a small race condition window but is acceptable as fallback
  if (rpcError && (rpcError.message?.includes('function') || rpcError.message?.includes('does not exist'))) {
    // Check if listing exists first
    const { data: listing, error: checkErr } = await supabase
      .from("listings")
      .select("id, pendingApprovals")
      .eq("id", id)
      .single();
    
    if (checkErr || !listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    
    // Increment pending approvals
    const currentCount = typeof listing.pendingApprovals === "number" ? listing.pendingApprovals : 0;
    const { data: updated, error: updateError } = await supabase
      .from("listings")
      .update({ 
        pendingApprovals: currentCount + 1,
        updatedAt: new Date().toISOString()
      })
      .eq("id", id)
      .select("pendingApprovals")
      .single();
    
    if (updateError) {
      if (updateError.message?.includes("pendingApprovals") || updateError.message?.includes("column")) {
        return res.status(500).json({ 
          error: "Database column 'pendingApprovals' does not exist. Please add it to the listings table." 
        });
      }
      return res.status(500).json({ error: updateError.message });
    }
    
    return res.json({ pendingApprovals: updated?.pendingApprovals || 0 });
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
  // Use SELECT * to avoid issues if pendingApprovals column doesn't exist yet
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: "Listing not found" });
  
  // Ensure pendingApprovals exists (default to 0 if column doesn't exist)
  if (data && typeof data.pendingApprovals !== "number") {
    data.pendingApprovals = 0;
  }
  
  // Also fetch owner info for contact details
  if (data?.ownerId) {
    const { data: owner, error: ownerError } = await supabase
      .from("users")
      .select("id, name, phone, email")
      .eq("id", data.ownerId)
      .single();
    if (!ownerError && owner) {
      return res.json({ ...data, owner });
    }
  }
  
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
      return res.status(400).json({ error: `${key} is required` });
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

  const { data, error } = await supabase.from("listings").insert(insert).select("*").single();
  if (error) {
    // If error mentions pendingApprovals or schema cache, it's likely the column doesn't exist
    // But since we're not including it in insert, this shouldn't happen unless SELECT * tries to get it
    // The error is likely from SELECT * trying to fetch a non-existent column
    return res.status(500).json({ error: error.message });
  }
  // Ensure pendingApprovals exists in response (default to 0 if column doesn't exist)
  if (data && typeof (data as any).pendingApprovals !== "number") {
    (data as any).pendingApprovals = 0;
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
  if (body.images !== undefined) update.images = Array.isArray(body.images) ? body.images : [];
  if (body.status !== undefined) update.status = body.status as OwnerStatus;

  const { data, error } = await supabase
    .from("listings")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return res.status(500).json({ error: error.message });
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
    .select("*")
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
