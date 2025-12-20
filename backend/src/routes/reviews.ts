import { Router } from "express";
import { supabase } from "../supabase";
import { jwtMiddleware } from "../middleware/auth";

const router = Router();

// GET /reviews/:boardingId - Get all reviews for a boarding (public)
router.get("/:boardingId", async (req, res) => {
  try {
    const { boardingId } = req.params;

    if (!boardingId) {
      return res.status(400).json({ error: "boardingId is required" });
    }

    // Fetch reviews with user information
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_id,
        users:user_id (
          name,
          email
        )
      `)
      .eq("boarding_id", boardingId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }

    // Transform the data to match frontend expectations
    const transformedReviews = (reviews || []).map((review: any) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      reviewer_name: review.users?.name || "Anonymous",
      reviewer_email: review.users?.email || null,
    }));

    return res.json(transformedReviews);
  } catch (e: any) {
    console.error("Get reviews error:", e);
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /reviews - Create a new review (requires authentication)
router.post("/", jwtMiddleware, async (req, res) => {
  try {
    const { boarding_id, rating, comment } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!boarding_id || typeof boarding_id !== "string") {
      return res.status(400).json({ error: "boarding_id is required" });
    }

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be a number between 1 and 5" });
    }

    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      return res.status(400).json({ error: "comment is required" });
    }

    // Check if user already reviewed this boarding
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("boarding_id", boarding_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingReview) {
      return res.status(409).json({ error: "You have already reviewed this boarding" });
    }

    // Verify the boarding exists
    const { data: boarding } = await supabase
      .from("listings")
      .select("id")
      .eq("id", boarding_id)
      .maybeSingle();

    if (!boarding) {
      return res.status(404).json({ error: "Boarding not found" });
    }

    // Create the review
    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        boarding_id,
        user_id: userId,
        rating,
        comment: comment.trim(),
      })
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_id,
        users:user_id (
          name,
          email
        )
      `)
      .single();

    if (error) {
      console.error("Error creating review:", error);
      if (error.code === "23505") {
        // Unique constraint violation
        return res.status(409).json({ error: "You have already reviewed this boarding" });
      }
      return res.status(500).json({ error: "Failed to create review" });
    }

    // Transform the response
    const transformedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      reviewer_name: (review.users as any)?.name || "Anonymous",
      reviewer_email: (review.users as any)?.email || null,
    };

    return res.status(201).json(transformedReview);
  } catch (e: any) {
    console.error("Create review error:", e);
    return res.status(500).json({ error: "Failed to create review" });
  }
});

export default router;
