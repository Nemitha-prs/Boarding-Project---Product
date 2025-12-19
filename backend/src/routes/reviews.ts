import { Router } from "express";
import { supabase } from "../supabase.js";
import { jwtMiddleware } from "../middleware/auth.js";

const router = Router();

// GET /reviews/:boardingId (public) - Get all reviews for a boarding
router.get("/:boardingId", async (req, res) => {
  try {
    const { boardingId } = req.params;
    
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, user_id")
      .eq("boarding_id", boardingId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching reviews:", error);
      // If table doesn't exist, return empty array instead of error
      if (error.message?.includes("does not exist") || error.message?.includes("schema cache")) {
        return res.json([]);
      }
      return res.status(500).json({ error: error.message });
    }
    
    // Fetch user info for each review
    const reviewsWithUsers = await Promise.all(
      (reviews || []).map(async (review: any) => {
        const { data: user } = await supabase
          .from("users")
          .select("name, email")
          .eq("id", review.user_id)
          .single();
        
        if (user?.email) {
          const [localPart, domain] = user.email.split("@");
          const maskedEmail = `${localPart.substring(0, 3)}***@${domain}`;
          return {
            ...review,
            reviewer_name: user.name || maskedEmail,
            reviewer_email: maskedEmail,
          };
        }
        return {
          ...review,
          reviewer_name: "Anonymous",
          reviewer_email: null,
        };
      })
    );
    
    // Cache reviews for 60 seconds
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.json(reviewsWithUsers);
  } catch (e: any) {
    console.error("Fetch reviews error:", e);
    return res.status(500).json({ error: "Failed to fetch reviews. Please try again." });
  }
});

// POST /reviews (user auth required) - Create a new review
router.post("/", jwtMiddleware, async (req, res) => {
  try {
    const { boarding_id, rating, comment } = req.body;
    const user_id = (req.user as any).id;
    
    // Validation
    if (!boarding_id || typeof boarding_id !== "string") {
      return res.status(400).json({ error: "boarding_id is required" });
    }
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be a number between 1 and 5" });
    }
    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      return res.status(400).json({ error: "comment is required" });
    }
    
    // Check if boarding exists
    const { data: boarding, error: boardingError } = await supabase
      .from("listings")
      .select("id")
      .eq("id", boarding_id)
      .single();
    
    if (boardingError || !boarding) {
      return res.status(404).json({ error: "Boarding not found" });
    }
    
    // Check if user already reviewed this boarding
    const { data: existingReview, error: checkError } = await supabase
      .from("reviews")
      .select("id")
      .eq("boarding_id", boarding_id)
      .eq("user_id", user_id)
      .maybeSingle();
    
    // If table doesn't exist, return helpful error
    if (checkError && (checkError.message?.includes("does not exist") || checkError.message?.includes("schema cache"))) {
      return res.status(500).json({ 
        error: "Reviews table not found. Please run the migration: Backend/migrations/create_reviews_table.sql in your Supabase SQL editor." 
      });
    }
    
    if (existingReview) {
      return res.status(409).json({ error: "You have already reviewed this boarding" });
    }
    
    // Create review
    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        boarding_id,
        user_id,
        rating,
        comment: comment.trim(),
      })
      .select("id, rating, comment, created_at, user_id")
      .single();
    
    if (insertError) {
      console.error("Error creating review:", insertError);
      // If table doesn't exist, return helpful error
      if (insertError.message?.includes("does not exist") || insertError.message?.includes("schema cache")) {
        return res.status(500).json({ 
          error: "Reviews table not found. Please run the migration: Backend/migrations/create_reviews_table.sql in your Supabase SQL editor." 
        });
      }
      return res.status(500).json({ error: insertError.message });
    }
    
    // Fetch user info
    const { data: user } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", user_id)
      .single();
    
    // Mask email for response
    const maskedEmail = user?.email 
      ? `${user.email.split("@")[0].substring(0, 3)}***@${user.email.split("@")[1]}`
      : null;
    
    return res.status(201).json({
      ...review,
      reviewer_name: user?.name || maskedEmail || "Anonymous",
      reviewer_email: maskedEmail,
    });
  } catch (e: any) {
    console.error("Create review error:", e);
    return res.status(500).json({ error: "Failed to submit review. Please try again." });
  }
});

export default router;

