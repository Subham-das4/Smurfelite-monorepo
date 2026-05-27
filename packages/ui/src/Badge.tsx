export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-violet-100 text-violet-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

const statusTone: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  DRAFT: "neutral",
  ACTIVE: "success",
  SOLD: "info",
  DELISTED_BY_SELLER: "warning",
  BANNED_BY_ADMIN: "danger",
  PENDING: "warning",
  PROCESSING: "info",
  COMPLETED: "success",
  CANCELLED: "neutral",
  REFUNDED: "danger",
  PAID: "success",
  FAILED: "danger",
  OPEN: "warning",
  UNDER_REVIEW: "info",
  RESOLVED_BUYER: "success",
  RESOLVED_SELLER: "success",
  CLOSED: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? "neutral"}>{status}</Badge>;
}
