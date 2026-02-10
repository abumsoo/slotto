'use client';

import { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-toast-slide-in">
      <div className="bg-card border border-border shadow-lg rounded-lg px-5 py-3 text-card-foreground">
        {message}
      </div>
    </div>
  );
}
