import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', glow = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#0f1929] border border-[#1a2a3a] rounded-xl p-6 transition-all duration-200 hover:border-[#00d4c8]/30 ${glow ? 'teal-glow' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
