import { type ReactNode, useEffect } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * A slide-up bottom sheet on mobile. On desktop (lg+) it centers as a dialog.
 * Closes on backdrop tap. Locks body scroll while open.
 */
export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />
      <div
        className="relative w-full lg:w-[460px] max-h-[85vh] overflow-y-auto no-scrollbar
                   bg-card rounded-t-[20px] lg:rounded-[20px] animate-sheet-up
                   border-t border-white/10 lg:border shadow-2xl bottom-safe"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 bg-card pt-3 pb-2 z-10">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-white/20 lg:hidden" />
          {title && (
            <h2 className="px-5 pt-2 text-cardtitle text-white">{title}</h2>
          )}
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
