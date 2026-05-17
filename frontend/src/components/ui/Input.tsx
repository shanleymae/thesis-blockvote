import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, rightElement, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs text-bv-ink-muted uppercase tracking-wider mb-1.5 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bv-ink-muted">
            {icon}
          </div>
        )}
        <input
          className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-bv-ink placeholder-bv-ink-muted transition-all duration-150 focus:border-bv-accent focus:bg-white/[0.06] focus:ring-1 focus:ring-bv-accent/30 focus:outline-none ${icon ? 'pl-11' : ''} ${rightElement ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default Input;
