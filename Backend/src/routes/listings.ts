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
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

// POST /listings/:id/increment-pending-approvals (public) - MUST be before /:id route
router.post("/:id/increment-pending-approvals", async (req, res) => {
  const id = req.params.id;

  // Check if listing exists
  const { data: listing, error: getErr } = await supabase
    .from("listings")
    .select("id, pendingApprovals")
    .eq("id", id)
    .single();
  if (getErr || !listing) return res.status(404).json({ error: "Listing not found" });

  // Increment pending approvals (handle case where column might not exist yet)
  const currentCount = typeof listing.pendingApprovals === "number" ? listing.pendingApprovals : 0;
  const { data, error } = await supabase
    .from("listings")
    .update({ 
      pendingApprovals: currentCount + 1,
      updatedAt: new Date().toISOString()
    })
    .eq("id", id)
    .select("pendingApprovals")
    .single();
  
  if (error) {
    // If column doesn't exist, return a helpful error
    if (error.message?.includes("pendingApprovals") || error.message?.includes("column")) {
      return res.status(500).json({ 
        error: "Database column 'pendingApprovals' does not exist. Please add it to the listings table." 
      });
    }
    return res.status(500).json({ error: error.message });
  }
  return res.json({ pendingApprovals: data.pendingApprovals });
});

// GET /listings/:id (public)
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const { data, error } = await supabase.from("listings").select("*").eq("id", id).single();
  if (error) return res.status(404).json({ error: "Listing not found" });
  
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
    pendingApprovals: typeof body.pendingApprovals === "number" ? body.pendingApprovals : 0,
    status: (body.status as OwnerStatus) ?? "Active",
    ownerId: (req.user as any).id,
    createdAt: now,
    updatedAt: now,
  };

  const { data, error } = await supabase.from("listings").insert(insert).select("*").single();
  if (error) return res.status(500).json({ error: error.message });
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
