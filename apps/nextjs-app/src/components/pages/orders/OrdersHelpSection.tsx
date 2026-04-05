import React from "react";
import Link from "next/link";
import { MdHelp, MdStar } from "react-icons/md";

export const OrdersHelpSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      {/* Support card */}
      <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-[#e0dbe6] dark:border-border-dark flex items-start gap-4 hover:shadow-md transition-shadow">
        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <MdHelp className="text-2xl" />
        </div>
        <div>
          <h3 className="text-[#141118] dark:text-white font-bold text-lg mb-1">
            Need help with an order?
          </h3>
          <p className="text-[#756189] dark:text-gray-400 text-sm mb-3">
            If you haven&apos;t received your account details within 1 hour,
            please contact our support team.
          </p>
          <Link
            href="/support"
            className="text-primary font-bold text-sm hover:underline"
          >
            Contact Support
          </Link>
        </div>
      </div>

      {/* Loyalty card */}
      <div className="bg-[#141118] p-6 rounded-2xl border border-[#141118] flex items-start gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/3 -translate-y-1/3 pointer-events-none">
          <MdStar className="text-[9rem] text-white" />
        </div>
        <div className="size-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 relative z-10">
          <MdStar className="text-2xl" />
        </div>
        <div className="relative z-10">
          <h3 className="text-white font-bold text-lg mb-1">Loyalty Rewards</h3>
          <p className="text-gray-400 text-sm mb-3">
            You have earned 450 points from these orders. Redeem them for
            discounts.
          </p>
          <Link
            href="/rewards"
            className="text-white font-bold text-sm hover:text-primary transition-colors"
          >
            View Rewards
          </Link>
        </div>
      </div>
    </div>
  );
};
