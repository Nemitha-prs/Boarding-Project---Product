import { Router } from "express";
import { supabase } from "../supabase.js";

const router = Router();

// GET /api/db-test
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
    if (!data) {
      return res.json({ ok: true, user: null, message: "No users found" });
    }
    return res.json({ ok: true, user: data });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
});

export default router;
