// components/TooltipPortal.tsx
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipPortalProps {
  label: string;
  children: ReactNode;
}

export function TooltipPortal({ label, children }: TooltipPortalProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });
  };

  useEffect(() => {
    if (show) {
      updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize, true);
      };
    }
  }, [show]);

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show &&
        createPortal(
          <span
            className="fixed z-[9999] -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-lg"
            style={{
              top: position.top - 8,
              left: position.left,
              transform: 'translateX(-50%)',
            }}
          >
            {label}
          </span>,
          document.body
        )}
    </span>
  );
}