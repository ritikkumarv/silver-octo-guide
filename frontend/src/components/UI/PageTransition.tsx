"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
