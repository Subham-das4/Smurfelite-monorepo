import { MdStar, MdStarHalf } from "react-icons/md";
import type { ProductReview } from "./types";

interface ReviewCardProps {
  review: ProductReview;
}

function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`size-8 rounded-full bg-gradient-to-br ${review.avatarGradient}`}
          />
          <span className="text-slate-900 text-sm font-bold">
            {review.author}
          </span>
        </div>
        <span className="text-slate-400 text-xs">{review.date}</span>
      </div>
      <div className="flex text-amber-400 mb-1">
        {Array.from({ length: review.rating }, (_, i) => (
          <MdStar key={i} className="text-[16px]" />
        ))}
      </div>
      <p className="text-slate-600 text-sm">{review.body}</p>
    </div>
  );
}

interface ReviewsPanelProps {
  overallRating: number;
  reviewCount: number;
  reviews: ProductReview[];
}

export function ReviewsPanel({
  overallRating,
  reviewCount,
  reviews,
}: ReviewsPanelProps) {
  return (
    <aside className="bg-white border border-slate-200 rounded-xl p-6 h-fit">
      <h3 className="text-xl font-bold text-slate-900 mb-4">
        Customer Reviews
      </h3>

      <div className="flex items-center gap-4 mb-6">
        <div className="text-5xl font-bold text-slate-900">
          {overallRating.toFixed(1)}
        </div>
        <div className="flex flex-col">
          <div className="flex text-amber-400">
            {Array.from({ length: 4 }, (_, i) => (
              <MdStar key={i} className="text-sm" />
            ))}
            <MdStarHalf className="text-sm" />
          </div>
          <span className="text-slate-500 text-xs">
            Based on {reviewCount} reviews
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      <button className="w-full mt-6 py-2 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
        View All Reviews
      </button>
    </aside>
  );
}
