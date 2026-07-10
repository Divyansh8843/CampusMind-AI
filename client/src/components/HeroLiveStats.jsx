import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, FileText, GraduationCap, Mic } from 'lucide-react';

const formatStat = (value) => {
  const num = Number(value) || 0;
  return `${num.toLocaleString('en-IN')}${num > 0 ? '+' : ''}`;
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-slate-900/90 px-6 py-5 text-center shadow-xl backdrop-blur-md dark:border-white/10">
    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
      <Icon size={20} />
    </div>
    <p className="text-3xl font-black tracking-tight text-white md:text-4xl">{formatStat(value)}</p>
    <p className="mt-1 text-sm font-medium text-slate-400">{label}</p>
  </div>
);

const HeroLiveStats = () => {
  const [stats, setStats] = useState({
    students: 0,
    documents: 0,
    alumni: 0,
    interviews: 0
  });
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/meta/public-stats`);
      if (res.data.success && res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Live stats fetch failed', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const intervalId = window.setInterval(fetchStats, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
      <StatCard icon={Users} label="Students" value={stats.students} delay={0.1} />
      <StatCard icon={FileText} label="Documents" value={stats.documents} delay={0.2} />
      <StatCard icon={GraduationCap} label="Verified Alumni" value={stats.alumni} delay={0.3} />
      <StatCard icon={Mic} label="Mock Interviews" value={stats.interviews} delay={0.4} />
    </div>
  );
};

export default HeroLiveStats;
