import { useCallback, type ReactNode, type MouseEvent } from 'react';

interface TappableProps {
  children: ReactNode;
  onTap?: () => void;
  className?: string;
  as?: 'div' | 'button' | 'li';
}

/** A wrapper that adds a material-style tap ripple (works on touch + click). */
export default function Tappable({ children, onTap, className = '', as = 'div' }: TappableProps) {
  const handle = useCallback((e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ink = document.createElement('span');
    ink.className = 'ripple-ink';
    ink.style.width = ink.style.height = `${size}px`;
    ink.style.left = `${e.clientX - rect.left - size / 2}px`;
    ink.style.top = `${e.clientY - rect.top - size / 2}px`;
    el.appendChild(ink);
    setTimeout(() => ink.remove(), 600);
    onTap?.();
  }, [onTap]);

  const Comp = as as 'div';
  return (
    <Comp className={`tap ${className}`} onClick={handle}>
      {children}
    </Comp>
  );
}
