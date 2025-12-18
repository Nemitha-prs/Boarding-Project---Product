import { Router } from "express";
import { supabase } from "../supabase";
import { jwtMiddleware } from "../middleware/auth";

const router = Router();

// GET /bookmarks (logged-in user) -> returns array of listingId
router.get("/", jwtMiddleware, async (req, res) => {
  const userId = req.user!.id;
  const { data, error } = await supabase
    .from("bookmarks")
    .select("listingId")
    .eq("userId", userId);
  if (error) return res.status(500).json({ error: error.message });
  const listingIds = (data ?? []).map((x) => x.listingId);
  return res.json({ listingIds });
});

// POST /bookmarks/:listingId -> create if not exists
router.post("/:listingId", jwtMiddleware, async (req, res) => {
  const userId = req.user!.id;
  const listingId = req.params.listingId;

  // Prevent duplicate
  const { data: existing, error: getErr } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("userId", userId)
    .eq("listingId", listingId)
    .maybeSingle();
  if (getErr) return res.status(500).json({ error: getErr.message });
  if (existing) return res.status(200).json({ ok: true });

  const { error } = await supabase
    .from("bookmarks")
    .insert({ userId, listingId, createdAt: new Date().toISOString() });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ ok: true });
});

// DELETE /bookmarks/:listingId
router.delete("/:listingId", jwtMiddleware, async (req, res) => {
  const userId = req.user!.id;
  const listingId = req.params.listingId;
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("userId", userId)
    .eq("listingId", listingId);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

export default router;
