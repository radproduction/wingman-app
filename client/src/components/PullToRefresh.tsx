import { useRef, useState, type ReactNode, type PointerEvent } from 'react';
import { RefreshIcon } from './icons';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}

/**
 * Pull-down-to-refresh for list pages. Uses natural document scrolling (the
 * page scrolls on the window), so the fixed bottom nav never overlaps content
 * as long as the page container carries bottom padding. The gesture only
 * engages when the window is scrolled to the very top and the user drags down.
 */
export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const MAX = 80;
  const TRIGGER = 60;

  function onDown(e: PointerEvent) {
    if (window.scrollY <= 0) startY.current = e.clientY;
    else startY.current = null;
  }
  function onMove(e: PointerEvent) {
    if (startY.current === null || refreshing) return;
    const dy = e.clientY - startY.current;
    if (dy > 0) setPull(Math.min(MAX, dy * 0.5));
  }
  async function onUp() {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= TRIGGER) {
      setRefreshing(true);
      setPull(TRIGGER);
      try { await onRefresh(); } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }

  return (
    <div
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div
        className="flex items-center justify-center text-accent transition-all overflow-hidden"
        style={{ height: pull, opacity: pull > 10 ? 1 : 0 }}
      >
        <RefreshIcon className={`w-5 h-5 ${refreshing ? 'animate-[spin_0.8s_linear_infinite]' : ''}`} />
      </div>
      {children}
    </div>
  );
}
