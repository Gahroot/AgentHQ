'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const variants = {
  hidden: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

interface StaggeredListProps {
  children: ReactNode;
  className?: string;
}

export function StaggeredList({ children, className }: StaggeredListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={listVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggeredItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

export function StaggeredItem({ children, className, index = 0 }: StaggeredItemProps) {
  return (
    <motion.div
      variants={itemVariants}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
