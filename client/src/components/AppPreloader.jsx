import React from 'react';
import { motion } from 'framer-motion';

const AppPreloader = ({ progress = 0 }) => {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="relative h-24 w-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-2xl border border-blue-400/30"
            />
            <img
              src="/logo.png"
              alt="CampusMind AI logo"
              className="h-full w-full rounded-2xl object-contain"
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        >
          CampusMind AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-2 text-sm text-slate-300"
        >
          Initializing your secure academic intelligence workspace
        </motion.p>

        <div className="mt-8 w-64">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Loading Resources...</span>
            <span>{safeProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-violet-400"
              initial={{ width: 0 }}
              animate={{ width: `${safeProgress}%` }}
              transition={{ ease: 'linear', duration: 0.15 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPreloader;
