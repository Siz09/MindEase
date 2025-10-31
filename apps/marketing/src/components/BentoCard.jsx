'use client';

import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: 'easeOut',
    },
  }),
};

export default function BentoCard({ icon, title, desc, custom, className }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      whileHover={{ scale: 1.02, translateY: -2 }}
      viewport={{ once: true, margin: '-100px' }}
      custom={custom}
      className={`group rounded-xl bg-surface border border-border p-6 md:p-8 cursor-pointer transition-all duration-300 hover:border-accent/30 hover:shadow-bento ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/3 group-hover:to-accent/5 rounded-xl transition-all duration-300 pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/15 transition-all duration-300">
          <div className="text-accent group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-lg text-text group-hover:text-accent transition-colors duration-300">
            {title}
          </h3>
          <p className="mt-2 text-text-light group-hover:text-text transition-colors duration-300 text-sm md:text-base">
            {desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
