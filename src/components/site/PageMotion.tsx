import { useEffect, useRef, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

/** Progressive enhancement: content remains visible without browser animation APIs. */
export function PageMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute("data-motion", "revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    function scan() {
      if (!root) return;
      root.querySelectorAll("h1, section > h2, article, .grid > div, video").forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        element.setAttribute("data-motion", "ready");
        observer.observe(element);
      });
    }
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutations.disconnect(); };
  }, [pathname]);

  return <main ref={ref} className="motion-surface">{children}</main>;
}