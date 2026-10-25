"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isDemoMode } from "@/lib/child/api";

export function useChildQuery() {
  const params = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return {
    params,
    ready: ready && params !== null,
    demo: params ? isDemoMode(params) : false,
  };
}

export function addDemoQuery(path: string, demo: boolean): string {
  if (!demo) return path;
  const url = new URL(path, "http://wordspire.local");
  url.searchParams.set("demo", "1");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function addQuery(path: string, values: Record<string, string | number | undefined>, demo = false): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) search.set(key, String(value));
  }
  if (demo) search.set("demo", "1");
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
