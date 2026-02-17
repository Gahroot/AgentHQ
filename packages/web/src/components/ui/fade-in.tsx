'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

const getVariants = (direction: FadeInProps['direction']) => {
  switch (direction) {
    case 'up':
      return {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      };
    case 'down':
      return {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0 },
      };
    case 'left':
      return {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
      };
    case 'right':
      return {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
      };
    case 'none':
    default:
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      };
  }
};

export function FadeIn({
  children,
  delay = 0,
  duration = 0.4,
  direction = 'up',
  className,
  ...props
}: FadeInProps) {
  const variants = getVariants(direction);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, duration = 0.3, className }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SlideInProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  isVisible?: boolean;
}

export function SlideIn({
  children,
  direction = 'right',
  delay = 0,
  duration = 0.3,
  className,
  isVisible = true,
}: SlideInProps) {
  const getOffset = () => {
    switch (direction) {
      case 'left':
        return -20;
      case 'right':
        return 20;
      case 'up':
        return -20;
      case 'down':
        return 20;
      default:
        return 20;
    }
  };

  const getAxis = () => {
    switch (direction) {
      case 'left':
      case 'right':
        return 'x';
      case 'up':
      case 'down':
        return 'y';
      default:
        return 'x';
    }
  };

  const axis = getAxis();
  const offset = getOffset();

  return (
    <motion.div
      initial={{ opacity: 0, [axis]: offset }}
      animate={isVisible ? { opacity: 1, [axis]: 0 } : { opacity: 0, [axis]: offset }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
