import { useEffect, useRef } from "react";

/**
 * Traps keyboard focus within a container element while active.
 * Restores focus to the previously focused element on cleanup.
 */
export function useFocusTrap<T extends HTMLElement>(active = true) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function getFocusableElements(): HTMLElement[] {
      if (!container) return [];
      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => !el.closest("[aria-hidden='true']")
      );
    }

    // Focus the first focusable element in the container
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [active]);

  return containerRef;
}
