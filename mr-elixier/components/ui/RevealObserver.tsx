"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Blendet Elemente mit `data-reveal` sanft ein, sobald sie ins Bild scrollen. */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    let queued = false;
    const scan = () => {
      queued = false;
      document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => io.observe(el));
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(scan);
    };

    scan();
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
