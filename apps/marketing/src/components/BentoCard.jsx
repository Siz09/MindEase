import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4
    }
  })
};

export default function BentoCard({ icon, title, desc, custom, className }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      whileHover={{ scale: 1.02 }}
      viewport={{ once: true }}
      custom={custom}
      className={`rounded-bento bg-slate-900/50 border border-slate-800 p-6 ${className}`}
    >
      <div className="flex items-center gap-4">
        {icon}
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <p className="mt-2 text-slate-300">{desc}</p>
    </motion.div>
  );
}
