export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (typeof data?.message === "string") return data.message;
  }
  return fallback;
}
