import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pop } from '../lib/motion';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const typeColors = {
    success: 'bg-pos/20 border-pos text-pos',
    error: 'bg-neg/20 border-neg text-neg',
    info: 'bg-accent/20 border-accent text-accent',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className={`fixed top-4 right-4 z-50 rounded-lg border-2 p-4 shadow-card backdrop-blur-sm ${typeColors[type]}`}
          style={{
            animation: 'shake 0.5s ease-in-out',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {message.split('\n').map((line, index) => (
                <div 
                  key={index}
                  className={`font-display text-sm ${
                    index === 0 ? 'font-semibold' : index === 1 ? 'italic' : 'text-current/80'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="text-current/70 hover:text-current transition-colors text-xl leading-none flex-shrink-0 mt-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Toast container component for managing multiple toasts
 */
interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string, type?: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts([...toasts, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            isVisible={true}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};