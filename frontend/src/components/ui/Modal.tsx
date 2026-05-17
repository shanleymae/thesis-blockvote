import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, className = '' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className={`bg-bv-surface border border-bv-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/40 ${className}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-bv-border">
          <h2 className="text-lg font-semibold text-bv-ink">{title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-bv-ink-muted hover:text-bv-ink hover:bg-bv-surface-hover transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
