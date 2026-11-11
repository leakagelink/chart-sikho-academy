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
    function scan(container: Element) {
      const phone = window.matchMedia("(max-width: 1023px)").matches;
      const selector = phone
        ? "h1, section > h2, article, .grid > div, .home-categories, .home-product-shelf, .home-membership, .profile-banner, .profile-menu, .dash-hello, .app-list > form"
        : "h1, section > h2, article, .grid > div";
      const elements = [...container.querySelectorAll(selector)];
      if (container.matches(selector)) elements.unshift(container);
      elements.forEach((element) => {
        if (seen.has(element) || element.closest(".lesson-screen") || element.querySelector("video, iframe")) return;
        // Animate the outer group once, not every nested card at the same time.
        if (phone && elements.some((parent) => parent !== element && parent.contains(element))) return;
        seen.add(element);
        element.setAttribute("data-motion", "ready");
        observer.observe(element);
      });
    }
    // Defer the first scan until React hydration has finished, so the
    // data-motion attributes never race with hydrating lazy route chunks.
    const initialScan = window.setTimeout(() => scan(root), 300);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof Element) scan(node);
      }));
    });
    mutations.observe(root, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(initialScan);
      observer.disconnect(); mutations.disconnect();
      root.querySelectorAll('[data-motion="ready"]').forEach((element) => element.removeAttribute("data-motion"));
    };
  }, [pathname]);

  return <main ref={ref} className={`motion-surface ${pathname === "/auth" || pathname === "/reset-password" || pathname.startsWith("/admin") ? "" : "student-surface"}`}>{children}</main>;
}