export function isChildPreviewMode(searchParams?: Pick<URLSearchParams, "get">): boolean {
  return process.env.NODE_ENV !== "production"
    && (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || searchParams?.get("demo") === "1");
}
