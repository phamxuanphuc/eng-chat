import { useState, useEffect, useRef, useCallback } from 'react';

export interface Position {
  x: number;
  y: number;
}

export const useDraggable = (
  elementRef: React.RefObject<HTMLElement>,
  storageKey: string = 'engchat_popup_position'
) => {
  const [position, setPosition] = useState<Position | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    width: number;
    height: number;
    currentPos: Position;
  } | null>(null);

  const clampPosition = useCallback((x: number, y: number, width: number, height: number): Position => {
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const maxY = Math.max(8, window.innerHeight - height - 8);
    return {
      x: Math.min(Math.max(8, x), maxX),
      y: Math.min(Math.max(8, y), maxY),
    };
  }, []);

  useEffect(() => {
    if (!position || !elementRef.current) return;
    const rect = elementRef.current.getBoundingClientRect();
    const clamped = clampPosition(position.x, position.y, rect.width || 460, rect.height || 300);
    if (clamped.x !== position.x || clamped.y !== position.y) {
      setPosition(clamped);
    }
  }, [clampPosition, elementRef]);

  useEffect(() => {
    const handleResize = () => {
      if (!position || !elementRef.current) return;
      const rect = elementRef.current.getBoundingClientRect();
      const clamped = clampPosition(position.x, position.y, rect.width || 460, rect.height || 300);
      setPosition(clamped);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, clampPosition, elementRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || !elementRef.current) return;
    e.preventDefault();

    const rect = elementRef.current.getBoundingClientRect();
    const currentLeft = rect.left;
    const currentTop = rect.top;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: currentLeft,
      startTop: currentTop,
      width: rect.width || 460,
      height: rect.height || 300,
      currentPos: { x: currentLeft, y: currentTop },
    };

    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      const rawX = dragRef.current.startLeft + dx;
      const rawY = dragRef.current.startTop + dy;

      const clamped = clampPosition(
        rawX,
        rawY,
        dragRef.current.width,
        dragRef.current.height
      );

      dragRef.current.currentPos = clamped;
      setPosition(clamped);
    };

    const onMouseUp = () => {
      if (dragRef.current) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(dragRef.current.currentPos));
        } catch (_) {}
      }
      dragRef.current = null;
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [clampPosition, elementRef, storageKey]);

  return {
    position,
    isDragging,
    handleMouseDown,
  };
};
