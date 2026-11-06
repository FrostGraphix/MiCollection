'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  X,
  ChevronDown,
  ShieldCheck,
  Send,
} from 'lucide-react';

export interface ReviewItem {
  id: string;
  productId: number;
  reviewerName: string;
  reviewerLocation: string;
  rating: number;
  title: string;
  comment: string;
  verifiedBuyer: boolean;
  fitRecommendation: 'runs_small' | 'true_to_size' | 'runs_large';
  sizePurchased?: string;
  helpfulCount: number;
  createdAt: string;
}

export interface ProductReviewsProps {
  productId: number;
  productName: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  productName,
}) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [distribution, setDistribution] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [fitPercent, setFitPercent] = useState<number>(95);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  // Review Submission Form State
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formFit, setFormFit] = useState<'runs_small' | 'true_to_size' | 'runs_large'>('true_to_size');
  const [formSize, setFormSize] = useState('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/products/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating || 5.0);
          setTotalReviews(data.totalReviews || 0);
          setDistribution(data.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
          setFitPercent(data.fitSummaryPercent || 95);
        }
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleUpvote = (id: string) => {
    if (upvotedIds.has(id)) return;
    setUpvotedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/products/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          reviewerName: formName,
          reviewerLocation: formCity || 'Abuja, Nigeria',
          rating: formRating,
          title: formTitle || 'Verified Client Experience',
          comment: formComment,
          fitRecommendation: formFit,
          sizePurchased: formSize,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.review) {
          setReviews((prev) => [data.review, ...prev]);
          setTotalReviews((prev) => prev + 1);
          setIsModalOpen(false);
          setFormComment('');
          setFormTitle('');
          setToastMessage('Thank you! Your verified review has been published.');
          setTimeout(() => setToastMessage(null), 5000);
        }
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (score: number, max = 5, sizeClass = 'w-4 h-4') => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[...Array(max)].map((_, i) => (
          <Star
            key={i}
            className={`${sizeClass} ${
              i < Math.round(score)
                ? 'fill-amber-400 text-amber-400'
                : 'text-[var(--line)] fill-none'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="pt-10 border-t border-[var(--line)] space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand px-3 py-1 rounded-full bg-brand/10 border border-brand/20">
            Client Testimonials & Feedback
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)] mt-2">
            Verified Reviews & Fit Guide
          </h2>
          <p className="text-xs text-[var(--mute)] mt-1">
            Real impressions from clients across Abuja, Lagos, and nationwide.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary text-xs py-2.5 px-5 self-start sm:self-auto"
        >
          <MessageSquare className="w-4 h-4" /> Write a Review
        </button>
      </div>

      {/* Score & Distribution Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-3xl bg-[var(--surface2)]/60 border border-[var(--line)]">
        {/* Left: Big Score & Trust Badge */}
        <div className="md:col-span-4 flex flex-col justify-center items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-[var(--line)] pb-6 md:pb-0 md:pr-6 space-y-2">
          <div className="font-display font-black text-5xl sm:text-6xl text-[var(--ink)]">
            {averageRating.toFixed(1)}
          </div>
          <div>{renderStars(averageRating, 5, 'w-5 h-5')}</div>
          <span className="text-xs text-[var(--mute)] font-medium">
            Based on {totalReviews} verified {totalReviews === 1 ? 'client' : 'clients'}
          </span>

          <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Authenticated Buyers</span>
          </div>
        </div>

        {/* Middle: Star Distribution Bars */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-[var(--mute)] font-medium flex items-center gap-1">
                  <span>{star}</span> <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--line)]">
                  <div
                    className="h-full bg-gradient-to-r from-brand to-orchid transition-all duration-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-[10px] text-[var(--mute)]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Sizing & Fit Intelligence */}
        <div className="md:col-span-3 flex flex-col justify-center items-center md:items-start text-center md:text-left border-t md:border-t-0 md:border-l border-[var(--line)] pt-6 md:pt-0 md:pl-6 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mute)]">
            Fit Intelligence
          </span>
          <div className="font-display font-extrabold text-2xl text-[var(--ink)]">
            {fitPercent}%
          </div>
          <p className="text-xs text-[var(--mute)] leading-relaxed">
            reported this piece fits <b>True to Size</b> with natural drape.
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-[var(--mute)] animate-pulse">
            Loading client experiences...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--line)] text-xs text-[var(--mute)]">
            Be the first to share your experience with {productName}!
          </div>
        ) : (
          reviews.map((rev) => {
            const hasUpvoted = upvotedIds.has(rev.id);

            return (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-3 transition-all hover:border-brand/30"
              >
                {/* Header: Rating + Verified Badge + Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {renderStars(rev.rating, 5, 'w-4 h-4')}
                    {rev.verifiedBuyer && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--mute)]">{rev.createdAt}</span>
                </div>

                {/* Title & Comment */}
                <div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-[var(--ink)]">
                    {rev.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--ink2)] mt-1.5 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>

                {/* Author Info + Sizing + Helpful Upvote */}
                <div className="pt-2 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--mute)]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--ink)]">{rev.reviewerName}</span>
                    <span>&bull;</span>
                    <span>{rev.reviewerLocation}</span>
                    {rev.sizePurchased && (
                      <>
                        <span>&bull;</span>
                        <span className="px-2 py-0.5 rounded bg-[var(--surface2)] font-mono text-[10px]">
                          Size: {rev.sizePurchased}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpvote(rev.id)}
                    disabled={hasUpvoted}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                      hasUpvoted
                        ? 'bg-brand/15 text-brand font-bold cursor-default'
                        : 'bg-[var(--surface2)] hover:bg-brand/10 text-[var(--mute)] hover:text-brand'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Helpful ({rev.helpfulCount})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl p-6 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ boxShadow: 'var(--shadow)' }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--line)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                  Client Feedback
                </span>
                <h3 className="font-display font-extrabold text-xl text-[var(--ink)] mt-0.5">
                  Write a Review
                </h3>
                <p className="text-xs text-[var(--mute)]">{productName}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--surface2)] text-[var(--mute)] hover:text-[var(--ink)]"
                aria-label="Close review modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReview} className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                  Your Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFormRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-[var(--line)] fill-none'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-amber-500">
                    {formRating === 5 ? 'Exceptional' : formRating === 4 ? 'Very Good' : `${formRating} Stars`}
                  </span>
                </div>
              </div>

              {/* Reviewer Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Halima B."
                    className="w-full text-xs h-10 px-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. Maitama, Abuja"
                    className="w-full text-xs h-10 px-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Headline / Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Sum up your experience in one sentence"
                  className="w-full text-xs h-10 px-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] outline-none focus:border-brand"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Your Detailed Review *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Tell other clients about the fabric, tailoring, comfort, and delivery experience..."
                  className="w-full text-xs p-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] outline-none focus:border-brand resize-none"
                />
              </div>

              {/* Fit Feedback */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Fit Assessment
                  </label>
                  <select
                    value={formFit}
                    onChange={(e) => setFormFit(e.target.value as any)}
                    className="w-full text-xs h-10 px-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] outline-none focus:border-brand"
                  >
                    <option value="runs_small">Runs Small</option>
                    <option value="true_to_size">True to Size (Recommended)</option>
                    <option value="runs_large">Runs Large / Generous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Size Purchased
                  </label>
                  <input
                    type="text"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    placeholder="e.g. Medium, 42 EU"
                    className="w-full text-xs h-10 px-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs py-3 w-full justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Publishing Review...' : 'Submit Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
