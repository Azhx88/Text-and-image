import { useRef, useEffect, useCallback } from 'react';

interface DragOptions {
  onDrag: (dx: number, dy: number) => void;
  onDragEnd?: () => void;
  containerRef: React.RefObject<HTMLElement>;
}

export const useDragToMove = (options: DragOptions) => {
  const { onDrag, onDragEnd, containerRef } = options;
  const activePointerId = useRef<number | null>(null);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0) return; // Only main button
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
    activePointerId.current = e.pointerId;
    lastPosition.current = { x: e.clientX, y: e.clientY };

    document.body.style.cursor = 'grabbing';
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (e.pointerId !== activePointerId.current) return;
    e.preventDefault();
    e.stopPropagation();

    if (lastPosition.current) {
      const dx = e.clientX - lastPosition.current.x;
      const dy = e.clientY - lastPosition.current.y;
      onDrag(dx, dy);
      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [onDrag]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (e.pointerId !== activePointerId.current) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    target.releasePointerCapture(e.pointerId);
    activePointerId.current = null;
    lastPosition.current = null;

    document.body.style.cursor = '';
    if (onDragEnd) {
      onDragEnd();
    }
  }, [onDragEnd]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('pointerdown', handlePointerDown);
      container.addEventListener('pointermove', handlePointerMove);
      container.addEventListener('pointerup', handlePointerUp);
      container.addEventListener('pointercancel', handlePointerUp);

      return () => {
        container.removeEventListener('pointerdown', handlePointerDown);
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('pointerup', handlePointerUp);
        container.removeEventListener('pointercancel', handlePointerUp);
      };
    }
  }, [containerRef, handlePointerDown, handlePointerMove, handlePointerUp]);
};
