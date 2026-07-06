import { useRef, useState, type ReactNode, type PointerEvent } from 'react';

interface SwipeableRowProps {
  children: ReactNode;
  onSwipe: () => void;
  actionLabel: string;
  actionColor?: string; // tailwind bg class
  disabled?: boolean;
}

/**
 * A row that reveals a colored action panel when swiped left.
 * Passing the threshold (or fully swiping) triggers onSwipe.
 * Works with touch (pointer events) and, for desktop testing, mouse drag.
 */
export default function SwipeableRow({
  children, onSwipe, actionLabel, actionColor = 'bg-success', disabled = false,
}: SwipeableRowProps) {
  const [dx, setDx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const horizontal = useRef(false);
  const THRESHOLD = 96;

  function onDown(e: PointerEvent) {
    if (disabled) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    horizontal.current = false;
    setAnimating(false);
  }
  function onMove(e: PointerEvent) {
    if (disabled || startX.current === null || startY.current === null) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;
    if (!horizontal.current && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
      horizontal.current = true;
    }
    if (horizontal.current) {
      // only allow left swipe
      setDx(Math.min(0, Math.max(-140, deltaX)));
    }
  }
  function onUp() {
    if (disabled) return;
    setAnimating(true);
    if (dx <= -THRESHOLD) {
      setDx(-360);
      setTimeout(() => onSwipe(), 180);
    } else {
      setDx(0);
    }
    startX.current = null;
    startY.current = null;
  }

  return (
    <div className="relative overflow-hidden rounded-card">
      <div className={`absolute inset-0 flex items-center justify-end pr-5 ${actionColor}`}>
        <span className="text-bg font-semibold text-body">{actionLabel}</span>
      </div>
      <div
        className={`relative ${animating ? 'transition-transform duration-200' : ''}`}
        style={{ transform: `translateX(${dx}px)`, touchAction: 'pan-y' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {children}
      </div>
    </div>
  );
}
