"use client";

import { useState, useEffect } from "react";
import { getApiUrl, getToken, isAuthenticated } from "@/lib/auth";
import { getCurrentUserId } from "@/lib/jwt";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  reviewer_name: string;
  reviewer_email: string | null;
}

interface ReviewSectionProps {
  boardingId: string;
}

export default function ReviewSection({ boardingId }: ReviewSectionProps) {
  const pathname = usePathname();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  // Review form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loggedIn = isAuthenticated();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID - refresh when logged in status changes or on mount
  useEffect(() => {
    const updateUserId = () => {
      const userId = getCurrentUserId();
      setCurrentUserId(userId);
    };
    
    updateUserId();
    
    // Listen for storage changes (in case token is updated in another tab)
    const handleStorageChange = () => {
      updateUserId();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loggedIn]);

  // Fetch reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(getApiUrl(`/reviews/${boardingId}`));
        if (!response.ok) throw new Error("Failed to fetch reviews");
        const data = await response.json();
        console.log("Fetched reviews with user_ids:", data.map((r: any) => ({ id: r.id, user_id: r.user_id, reviewer: r.reviewer_name })));
        setReviews(data);
        // Refresh user ID after fetching reviews to ensure it's up to date
        const userId = getCurrentUserId();
        console.log("Current logged in user ID:", userId);
        if (userId) {
          setCurrentUserId(userId);
        }
      } catch (err: any) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [boardingId]);

  // Submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedIn || rating === 0 || !comment.trim()) return;

    setSubmitting(true);
    setSubmitError("");
    setError("");

    try {
      const token = getToken();
      const response = await fetch(getApiUrl("/reviews"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          boarding_id: boardingId,
          rating,
          comment: comment.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit review");
      }

      const newReview = await response.json();
      console.log("New review created with user_id:", newReview.user_id);
      setReviews([newReview, ...reviews]);
      setRating(0);
      setComment("");
      setShowForm(false);
      // No success message when review is added
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Show delete confirmation modal
  const handleDeleteClick = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setShowDeleteConfirm(true);
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setReviewToDelete(null);
  };

  // Confirm and delete review
  const handleDelete = async () => {
    if (!reviewToDelete) return;

    setDeleting(reviewToDelete);
    setError("");
    setShowDeleteConfirm(false);

    try {
      const token = getToken();
      const response = await fetch(getApiUrl(`/reviews/${reviewToDelete}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete review");
      }

      // Remove the review from the list
      setReviews(reviews.filter((r) => r.id !== reviewToDelete));
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
      setReviewToDelete(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete review");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-900">Reviews</h3>
        {reviews.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg ${
                    star <= Math.round(averageRating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm font-medium text-slate-600">
              {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}
      </div>

      {/* Review Form */}
      {loggedIn ? (
        !showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Write a Review
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-gray-200 bg-slate-50 p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`text-2xl transition ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-400 scale-110"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {rating} {rating === 1 ? "star" : "stars"}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Review
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-accent focus:outline-none"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={rating === 0 || !comment.trim() || submitting}
                className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setRating(0);
                  setComment("");
                  setSubmitError("");
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>

            {submitError && (
              <p className="mt-2 text-sm text-red-600">{submitError}</p>
            )}
          </form>
        )
      ) : (
        <div className="mb-6 rounded-xl border border-gray-200 bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-600 mb-3">
            Login to write a review
          </p>
          <div className="flex gap-2 justify-center">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname || "")}`}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Login
            </Link>
            <Link
              href={`/signup?redirect=${encodeURIComponent(pathname || "")}`}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-center text-sm font-medium text-red-700">{error}</p>
        </div>
      )}
      {deleteSuccess && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3">
          <p className="text-center text-sm font-medium text-red-800">Review deleted successfully!</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleCancelDelete}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Delete Review</h3>
              <p className="mt-2 text-sm text-slate-600">
                Are you sure you want to delete this review? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting !== null}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-8">
          No reviews yet. Be the first to review!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            // Compare user IDs - normalize both to strings and compare exactly
            const normalizeId = (id: string | null | undefined): string => {
              if (!id) return '';
              // Convert to string, trim whitespace, but keep case (UUIDs are case-sensitive)
              return String(id).trim();
            };
            
            const normalizedCurrentId = normalizeId(currentUserId);
            const normalizedReviewId = normalizeId(review.user_id);
            const isOwner = normalizedCurrentId !== '' && 
                           normalizedReviewId !== '' && 
                           normalizedCurrentId === normalizedReviewId;
            
            return (
              <div
                key={review.id}
                className="relative rounded-xl border border-gray-100 bg-slate-50/50 p-4"
              >
                {/* Delete button - only visible to review owner, positioned at top-right corner */}
                {isOwner && (
                  <button
                    onClick={() => handleDeleteClick(review.id)}
                    disabled={deleting === review.id || showDeleteConfirm}
                    className="absolute top-2 right-2 z-10 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    title="Delete review"
                    aria-label="Delete review"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                )}
                
                <div className="flex items-start justify-between mb-2 pr-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{review.reviewer_name}</p>
                      {isOwner && (
                        <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(review.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= review.rating ? "text-yellow-400" : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{review.comment}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

