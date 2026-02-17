'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface HoverCardWrapperProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  disabled?: boolean;
}

export function HoverCardWrapper({
  children,
  disabled = false,
  className,
  ...props
}: HoverCardWrapperProps) {
  return (
    <motion.div
      whileHover={disabled ? undefined : { scale: 1.02, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface ShimmerProps {
  children: ReactNode;
  className?: string;
}

export function Shimmer({ children, className }: ShimmerProps) {
  return (
    <motion.div
      className={className}
      initial={{ backgroundPosition: '100% 50%' }}
      animate={{ backgroundPosition: ['0% 50%', '100% 50%'] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'linear',
      }}
      style={{
        backgroundSize: '200% 200%',
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      }}
    >
      {children}
    </motion.div>
  );
}

interface PulseBorderProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export function PulseBorder({ children, className, color = 'rgb(59, 130, 246)' }: PulseBorderProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ boxShadow: `0 0 0 0 ${color}40` }}
      animate={{
        boxShadow: [
          `0 0 0 0 ${color}40`,
          `0 0 0 8px ${color}00`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: 'loop',
      }}
    >
      {children}
    </motion.div>
  );
}
