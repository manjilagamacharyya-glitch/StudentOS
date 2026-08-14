'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';

interface SubjectData {
  id: string;
  attended: number;
  total: number;
}

export default function MasterAnalytics() {
  const { user } = useAuth();
  const [subjectsData, setSubjectsData] = useState<SubjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const subjectsRef = collection(db, `users/${user.uid}/semesters/sem_3/subjects`);
    
    const unsubscribe = onSnapshot(subjectsRef, (snapshot) => {
      const data: SubjectData[] = [];
      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          attended: doc.data().attended || 0,
          total: doc.data().total || 0,
        });
      });
      setSubjectsData(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const totalClasses = subjectsData.reduce((acc, curr) => acc + curr.total, 0);
  const totalAttended = subjectsData.reduce((acc, curr) => acc + curr.attended, 0);
  const totalMissed = totalClasses - totalAttended;
  const overallPercentage = totalClasses === 0 ? 100 : Math.round((totalAttended / totalClasses) * 100);
  const isOverallSafe = overallPercentage >= 75;

  const overallPieData = [
    { name: 'Attended', value: totalAttended },
    { name: 'Missed', value: totalMissed }
  ];

  const barChartData = subjectsData.map(sub => ({
    name: sub.id,
    Present: sub.attended,
    Absent: sub.total - sub.attended,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 !bg-black/80 !border-white/10 rounded-2xl">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <main className="min-h-screen text-white p-6 md:p-12 font-sans flex flex-col items-center">
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accentBlue/20 rounded-2xl text-accentBlue">
            <BarChart3 size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Master Analytics</h1>
            <p className="text-gray-400 mt-1">Your overall semester performance</p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="text-gray-500 animate-pulse mt-20">Loading analytics...</div>
      ) : subjectsData.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-400 w-full max-w-5xl rounded-[32px]">
          No data available to analyze yet. Head to the Dashboard to add your subjects.
        </div>
      ) : (
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-1 flex flex-col gap-6"
          >
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center rounded-[32px] relative isolate overflow-hidden">
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[80px] opacity-20 -z-10 rounded-full ${isOverallSafe ? 'bg-accentGreen' : 'bg-accentRed'}`}></div>
              <h2 className="text-xl font-bold mb-2 text-gray-200">Semester Health</h2>
              <div className="w-64 h-64 relative mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={overallPieData} cx="50%" cy="50%" innerRadius={85} outerRadius={110} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                      <Cell key="cell-0" fill={isOverallSafe ? '#32D74B' : '#FF453A'} />
                      <Cell key="cell-1" fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-5xl font-extrabold">{overallPercentage}%</span>
                  <span className="text-sm text-gray-400 mt-1">Total Attendance</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 flex flex-col items-center justify-center text-center rounded-2xl border-t-4 border-t-accentBlue">
                <span className="text-3xl font-extrabold">{totalClasses}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Classes</span>
              </div>
              <div className="glass-card p-4 flex flex-col items-center justify-center text-center rounded-2xl border-t-4 border-t-accentGreen">
                <span className="text-3xl font-extrabold text-accentGreen">{totalAttended}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider mt-1 flex items-center gap-1"><CheckCircle2 size={12}/> Present</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card p-8 flex flex-col rounded-[32px]"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                <TrendingUp size={20} className="text-accentBlue" />
                Subject Breakdown
              </h2>
            </div>
            
            <div className="flex-1 w-full min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="Present" stackId="a" fill="#32D74B" radius={[0, 0, 4, 4]} barSize={40} />
                  <Bar dataKey="Absent" stackId="a" fill="#FF453A" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}