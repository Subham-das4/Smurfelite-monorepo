import Link from "next/link";
import type { CheckoutAvailabilityIssue } from "@/lib/checkoutAvailability";

interface CheckoutUnavailableAlertProps {
  issues: CheckoutAvailabilityIssue[];
}

export function CheckoutUnavailableAlert({
  issues,
}: CheckoutUnavailableAlertProps) {
  if (issues.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
      role="alert"
    >
      <p className="font-semibold mb-2">
        {issues.length === 1
          ? "An item in your order is no longer available"
          : `${issues.length} items in your order are no longer available`}
      </p>
      <ul className="list-disc pl-5 space-y-1 mb-3">
        {issues.map((issue) => (
          <li key={issue.productId}>
            <span className="font-medium">{issue.title}</span>
            {" — "}
            {issue.reason}
          </li>
        ))}
      </ul>
      <p className="text-amber-900/80 dark:text-amber-200/90">
        Remove unavailable items or choose another account before paying.
      </p>
      <Link
        href="/products"
        className="inline-block mt-3 font-semibold text-primary hover:underline"
      >
        Browse available accounts
      </Link>
    </div>
  );
}
