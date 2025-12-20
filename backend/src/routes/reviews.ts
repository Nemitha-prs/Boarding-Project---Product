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
    const transformedReviews = (reviews || []).map((review: any) => {
      const transformed = {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        user_id: review.user_id || null, // Ensure user_id is included, even if null
        reviewer_name: review.users?.name || "Anonymous",
        reviewer_email: review.users?.email || null,
      };
      console.log("Transformed review:", { id: transformed.id, user_id: transformed.user_id });
      return transformed;
    });

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
    console.log("Creating review with user_id:", userId, "for boarding:", boarding_id);
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
        // Unique constraint violation - already checked above, but handle if race condition occurs
        return res.status(409).json({ error: "You have already reviewed this boarding" });
      }
      return res.status(500).json({ error: "Failed to create review" });
    }

    console.log("Review created successfully:", {
      id: review.id,
      user_id: review.user_id,
      boarding_id: boarding_id
    });

    // Transform the response
    const transformedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      user_id: review.user_id,
      reviewer_name: (review.users as any)?.name || "Anonymous",
      reviewer_email: (review.users as any)?.email || null,
    };

    return res.status(201).json(transformedReview);
  } catch (e: any) {
    console.error("Create review error:", e);
    return res.status(500).json({ error: "Failed to create review" });
  }
});

// DELETE /reviews/:reviewId - Delete a review (requires authentication, only owner can delete)
router.delete("/:reviewId", jwtMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!reviewId) {
      return res.status(400).json({ error: "reviewId is required" });
    }

    // Check if review exists and belongs to the user
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("id, user_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching review:", fetchError);
      return res.status(500).json({ error: "Failed to fetch review" });
    }

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if the user owns this review
    if (review.user_id !== userId) {
      return res.status(403).json({ error: "You can only delete your own reviews" });
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting review:", deleteError);
      return res.status(500).json({ error: "Failed to delete review" });
    }

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (e: any) {
    console.error("Delete review error:", e);
    return res.status(500).json({ error: "Failed to delete review" });
  }
});

export default router;
