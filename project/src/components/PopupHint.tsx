import React, { useState, useEffect, useRef, useCallback } from 'react';

interface PopupHintProps {
  message: string;
  targetRef: React.RefObject<HTMLElement>;
  show: boolean;
  onHide: () => void;
}

export function PopupHint({ message, targetRef, show, onHide }: PopupHintProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (show && targetRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      
      setPosition({
        top: targetRect.bottom + 8,
        left: targetRect.left,
      });
    }
  }, [show, targetRef]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        if (targetRef.current && !targetRef.current.contains(event.target as Node)) {
          onHide();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onHide();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [show, onHide, targetRef]);

  if (!show) return null;

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        backgroundColor: 'var(--bg-secondary, #ffffff)',
        color: '#D2042D',
        padding: '10px 12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: '13px',
        fontWeight: '500',
        zIndex: 1000,
        maxWidth: '300px',
        animation: 'fadeIn 250ms ease-in-out',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
      }}
    >
      <span style={{ fontSize: '14px', lineHeight: '1.4' }}>ℹ️</span>
      <span style={{ lineHeight: '1.4' }}>{message}</span>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

interface PopupHintWrapperProps {
  children: React.ReactNode;
  message: string;
}

export function PopupHintWrapper({ children, message }: PopupHintWrapperProps) {
  const [showHint, setShowHint] = useState(false);
  const targetRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFocus = useCallback(() => {
    setShowHint(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay hiding to allow for field navigation
    setTimeout(() => {
      setShowHint(false);
    }, 100);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowHint(false);
    }
  }, []);

  return (
    <div ref={containerRef} onFocus={handleFocus} onBlur={handleBlur} onKeyDown={handleKeyDown}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement, {
            ref: targetRef,
          });
        }
        return child;
      })}
      <PopupHint
        message={message}
        targetRef={targetRef}
        show={showHint}
        onHide={() => setShowHint(false)}
      />
    </div>
  );
}
