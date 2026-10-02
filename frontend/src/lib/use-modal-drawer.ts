'use client';

import { useLayoutEffect, useRef } from 'react';

const focusableSelector = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';

function focusableElements(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => {
    if (element.tabIndex < 0 || element.matches(':disabled') || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    }
    return true;
  });
}

let scrollLocks = 0;
let restoreScroll: (() => void) | undefined;
const activePanels: HTMLElement[] = [];

function lockPageScroll() {
  if (scrollLocks++ === 0) {
    const saved = [document.body, document.documentElement].map((element) => ({
      element,
      properties: ['overflow', 'overflow-x', 'overflow-y'].map((name) => ({
        name, value: element.style.getPropertyValue(name), priority: element.style.getPropertyPriority(name),
      })),
    }));
    saved.forEach(({ element }) => element.style.setProperty('overflow', 'hidden', 'important'));
    restoreScroll = () => saved.forEach(({ element, properties }) => {
      element.style.removeProperty('overflow');
      properties.forEach(({ name, value, priority }) => {
        if (value) element.style.setProperty(name, value, priority);
      });
    });
  }
  return () => {
    if (--scrollLocks === 0) {
      restoreScroll?.();
      restoreScroll = undefined;
    }
  };
}

/** Shared keyboard/focus lifecycle for the mutually exclusive storefront drawers. */
export function useModalDrawer(isOpen: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;

    const trigger = document.activeElement;
    const unlockScroll = lockPageScroll();
    activePanels.push(panel);
    const isActive = () => activePanels[activePanels.length - 1] === panel;
    const focusFirst = () => (closeRef.current ?? focusableElements(panel)[0] ?? panel).focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isActive()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      } else if (event.key === 'Tab') {
        const elements = focusableElements(panel);
        const first = elements[0];
        const last = elements[elements.length - 1];
        const focused = document.activeElement;
        if (!first) {
          event.preventDefault();
          panel.focus();
        } else if (!panel.contains(focused) || focused === panel ||
          (event.shiftKey ? focused === first : focused === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (isActive() && event.target instanceof Node && !panel.contains(event.target)) focusFirst();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    focusFirst();

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
      const wasActive = isActive();
      activePanels.splice(activePanels.indexOf(panel), 1);
      unlockScroll();
      if (wasActive) {
        const remainingPanel = activePanels[activePanels.length - 1];
        if (trigger instanceof HTMLElement && trigger.isConnected && (!remainingPanel || remainingPanel.contains(trigger))) {
          trigger.focus({ preventScroll: true });
        } else if (remainingPanel) {
          (focusableElements(remainingPanel)[0] ?? remainingPanel).focus({ preventScroll: true });
        }
      }
    };
  }, [isOpen, onClose]);

  return { panelRef, closeRef };
}
