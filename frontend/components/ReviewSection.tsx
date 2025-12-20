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
  const [success, setSuccess] = useState(false);
  
  // Review form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loggedIn = isAuthenticated();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID - refresh when logged in status changes
  useEffect(() => {
    const userId = getCurrentUserId();
    setCurrentUserId(userId);
  }, [loggedIn]);

  // Fetch reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(getApiUrl(`/reviews/${boardingId}`));
        if (!response.ok) throw new Error("Failed to fetch reviews");
        const data = await response.json();
        console.log("Fetched reviews data:", data);
        setReviews(data);
        // Refresh user ID after fetching reviews to ensure it's up to date
        const userId = getCurrentUserId();
        console.log("Current user ID from token:", userId);
        setCurrentUserId(userId);
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
    setSuccess(false);

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
      setReviews([newReview, ...reviews]);
      setRating(0);
      setComment("");
      setShowForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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

  // Delete review
  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    setDeleting(reviewId);
    setError("");

    try {
      const token = getToken();
      const response = await fetch(getApiUrl(`/reviews/${reviewId}`), {
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
      setReviews(reviews.filter((r) => r.id !== reviewId));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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
            {success && (
              <p className="mt-2 text-sm text-green-600">Review submitted successfully!</p>
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
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-center text-sm font-medium text-green-700">Review deleted successfully!</p>
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
            // Compare user IDs - ensure both exist and match exactly
            const isOwner = Boolean(
              currentUserId && 
              review.user_id && 
              String(currentUserId).trim() === String(review.user_id).trim()
            );
            
            // Debug logging
            if (loggedIn) {
              console.log("Review Debug:", {
                reviewId: review.id,
                reviewUserId: review.user_id,
                reviewUserIdType: typeof review.user_id,
                currentUserId: currentUserId,
                currentUserIdType: typeof currentUserId,
                isOwner: isOwner,
                loggedIn: loggedIn
              });
            }
            
            return (
              <div
                key={review.id}
                className="relative rounded-xl border border-gray-100 bg-slate-50/50 p-4"
              >
                {/* Delete button - only visible to review owner, positioned at top-right corner */}
                {isOwner ? (
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={deleting === review.id}
                    className="!absolute !top-2 !right-2 !z-[9999] !p-2.5 !text-red-600 hover:!text-red-700 hover:!bg-red-100 !rounded-lg !transition-all disabled:!opacity-50 disabled:!cursor-not-allowed disabled:hover:!bg-red-50 !border-2 !border-red-500 !bg-white !shadow-lg hover:!shadow-xl"
                    title="Delete review"
                    aria-label="Delete review"
                    style={{ 
                      position: 'absolute !important',
                      top: '8px !important',
                      right: '8px !important',
                      zIndex: '9999 !important',
                      backgroundColor: '#ffffff !important',
                      border: '2px solid #ef4444 !important',
                      color: '#dc2626 !important',
                      cursor: 'pointer',
                      display: 'block',
                      visibility: 'visible',
                      opacity: '1'
                    }}
                  >
                    <Trash2 size={20} strokeWidth={2.5} />
                  </button>
                ) : loggedIn ? (
                  <div 
                    className="absolute top-2 right-2 z-40 text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-300"
                    title={`Debug: Your ID: ${currentUserId || 'none'}, Review User ID: ${review.user_id || 'none'}, Match: ${String(currentUserId) === String(review.user_id)}`}
                  >
                    Not yours
                  </div>
                ) : null}
                
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

