export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">
      {message}
    </div>
  );
}
