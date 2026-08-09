import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface SeedInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SeedInstructionModal({ isOpen, onClose }: SeedInstructionModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay for smooth entrance animation
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-4xl rounded-xl bg-white shadow-2xl transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } sm:max-h-[85vh] sm:overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button at top */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 hover:scale-110"
          title="Close (ESC)"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image container - full screen on mobile */}
        <div className="w-full overflow-auto p-4 sm:max-h-[85vh] sm:p-6">
          <img
            src="/images/Cotton Seed sample drawl procedure .png"
            alt="Cotton Seed Sample Drawl Procedure"
            className="mx-auto w-full rounded-lg shadow-md object-contain"
          />
        </div>
      </div>
    </div>
  );
}
