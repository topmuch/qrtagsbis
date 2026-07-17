'use client';

import { useEffect, useRef } from 'react';

interface SuccessOverlayProps {
  show: boolean;
  messageKey: string;
  t: (key: string) => string;
  duration?: number;
  onClose?: () => void;
}

export default function SuccessOverlay({
  show,
  messageKey,
  t,
  duration = 5000,
  onClose,
}: SuccessOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onCloseRef = useRef(onClose);

  // Keep onClose ref in sync without accessing during render
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Manage animation lifecycle via DOM manipulation (no setState in effect)
  useEffect(() => {
    // Cleanup previous timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const el = containerRef.current;
    const circle = checkRef.current;
    const text = textRef.current;

    if (show && el && circle && text) {
      // Reset animation classes first (force restart)
      circle.classList.remove('animate-scale-in');
      text.classList.remove('animate-fade-in');
      void circle.offsetWidth; // trigger reflow to restart CSS animations
      void text.offsetWidth;

      // Add animation classes and show
      circle.classList.add('animate-scale-in');
      text.classList.add('animate-fade-in');
      el.style.display = 'flex';
      el.classList.remove('animate-fade-out', 'pointer-events-none');

      // Schedule fade-out start (500ms before full disappearance)
      const fadeTimer = setTimeout(() => {
        el.classList.add('animate-fade-out', 'pointer-events-none');
      }, duration - 500);
      timersRef.current.push(fadeTimer);

      // Schedule full hide + callback
      const hideTimer = setTimeout(() => {
        el.style.display = 'none';
        onCloseRef.current?.();
      }, duration);
      timersRef.current.push(hideTimer);
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [show, duration]);

  // Fallback: if t() returns the key itself, use French as default
  const message = t(messageKey);
  const isFallback = message === messageKey;
  const displayMessage = isFallback
    ? messageKey === 'scan.success'
      ? 'Scan réussi ! ✓'
      : 'Activation réussie ! ✓'
    : message;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ display: 'none' }}
      role="status"
      aria-live="polite"
      aria-label={displayMessage}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-5 px-6">
        {/* Green checkmark circle */}
        <div
          ref={checkRef}
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
        >
          {/* Checkmark SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Message text */}
        <p
          ref={textRef}
          className="text-white font-bold text-xl md:text-2xl text-center drop-shadow-lg"
        >
          {displayMessage}
        </p>
      </div>
    </div>
  );
}
