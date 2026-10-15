import { useEffect } from "react";

// Decorative motion only: the UI remains readable if observers are unavailable.
export function usePageMotion() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(
      "main .section-heading, main .use-cases .card, main .flow-lane, main .gallery-details, main .boundary-card, main .engineering-list article, main .evidence-strip > div, main .roadmap-grid article, main .about-panel, main .final-cta",
    ));

    function revealEverything() {
      observer?.disconnect();
      elements.forEach(element => element.classList.add("is-revealed"));
    }

    function setup() {
      observer?.disconnect();
      if (preference.matches || !("IntersectionObserver" in window)) {
        revealEverything();
        return;
      }
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer?.unobserve(entry.target);
        }
      }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
      elements.forEach((element, index) => {
        if (element.classList.contains("is-revealed")) return;
        element.dataset.reveal = "";
        // Restrained stagger keeps groups readable without a long cascade.
        const siblings = element.parentElement?.children;
        const siblingIndex = siblings ? Array.from(siblings).indexOf(element) : index;
        element.style.setProperty("--reveal-delay", String((siblingIndex % 3) * 65) + "ms");
        observer?.observe(element);
      });
    }

    function showFocusedContent(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest("[data-reveal]");
      if (target) {
        target.classList.add("is-revealed");
        observer?.unobserve(target);
      }
    }

    function updateProgress() {
      frame = 0;
      const range = root.scrollHeight - window.innerHeight;
      const progress = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
      root.style.setProperty("--page-progress", String(progress));
    }
    function scheduleProgress() {
      if (!frame) frame = requestAnimationFrame(updateProgress);
    }

    setup();
    updateProgress();
    preference.addEventListener("change", setup);
    document.addEventListener("focusin", showFocusedContent);
    window.addEventListener("scroll", scheduleProgress, { passive: true });
    window.addEventListener("resize", scheduleProgress);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", setup);
      document.removeEventListener("focusin", showFocusedContent);
      window.removeEventListener("scroll", scheduleProgress);
      window.removeEventListener("resize", scheduleProgress);
      root.style.removeProperty("--page-progress");
      elements.forEach(element => {
        delete element.dataset.reveal;
        element.style.removeProperty("--reveal-delay");
      });
    };
  }, []);
}
