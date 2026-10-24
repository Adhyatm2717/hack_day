"use client";

import { useEffect, useState } from "react";
import { getIncomingRequests } from "@/lib/data";

/** Small shell-ready badge that keeps the host's pending request count fresh. */
export function PendingRequestBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const requests = await getIncomingRequests(); if (active) setCount(requests.length); }
      catch { /* Keep the last known count during transient network errors. */ }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  if (count === 0) return null;
  return <span aria-label={`${count} pending requests`} className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-charge px-1.5 text-charge-foreground text-[10px] font-bold leading-none">{count > 99 ? "99+" : count}</span>;
}
