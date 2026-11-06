import React, { useEffect, useRef } from 'react';

type Handler = React.MutableRefObject<() => void>;

const escapeStack: Handler[] = [];

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || escapeStack.length === 0) return;
  event.stopPropagation();
  escapeStack[escapeStack.length - 1].current();
};

export const useEscape = (active: boolean, onEscape: () => void) => {
  const handler = useRef(onEscape);
  handler.current = onEscape;

  useEffect(() => {
    if (!active) return;
    if (escapeStack.length === 0) document.addEventListener('keydown', handleEscapeKey, true);
    escapeStack.push(handler);
    return () => {
      escapeStack.splice(escapeStack.indexOf(handler), 1);
      if (escapeStack.length === 0) document.removeEventListener('keydown', handleEscapeKey, true);
    };
  }, [active]);
};

export const useDismiss = (
  containerRef: React.RefObject<HTMLElement>,
  active: boolean,
  onDismiss: () => void,
) => {
  const handler = useRef(onDismiss);
  handler.current = onDismiss;
  useEscape(active, onDismiss);

  useEffect(() => {
    if (!active) return;
    const handlePointerDown = (event: Event) => {
      if (containerRef.current && !event.composedPath().includes(containerRef.current)) handler.current();
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [active, containerRef]);
};
