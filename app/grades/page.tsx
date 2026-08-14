'use client';


import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, GraduationCap, Target, Plus, Trash2, Calculator, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

interface SemesterGrade {
  id: string;
  name: string;
  sgpa: number;
}

export default function PredictiveGrades() {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<SemesterGrade[]>([]);
  const [targetCgpa, setTargetCgpa] = useState<number>(8.0);
  const [totalDegreeSems, setTotalDegreeSems] = useState<number>(8);
  const [isLoading, setIsLoading] = useState(true);

  const [newSemName, setNewSemName] = useState("");
  const [newSgpa, setNewSgpa] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    const settingsRef = doc(db, `users/${user.uid}/settings/grades`);
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setTargetCgpa(docSnap.data().targetCgpa || 8.0);
        setTotalDegreeSems(docSnap.data().totalDegreeSems || 8);
      }
    });

    const gradesRef = collection(db, `users/${user.uid}/semesters_grades`);
    const q = query(gradesRef, orderBy('timestamp', 'asc'));
    const unsubGrades = onSnapshot(q, (snapshot) => {
      const data: SemesterGrade[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as SemesterGrade);
      });
      setSemesters(data);
      setIsLoading(false);
    });

    return () => {
      unsubSettings();
      unsubGrades();
    };
  }, [user?.uid]);

  const totalCompleted = semesters.length;
  const remainingSems = totalDegreeSems - totalCompleted;
  const sumSgpa = semesters.reduce((acc, curr) => acc + curr.sgpa, 0);
  const currentCgpa = totalCompleted === 0 ? 0 : Number((sumSgpa / totalCompleted).toFixed(2));
  
  let requiredSgpa = 0;
  if (remainingSems > 0) {
    requiredSgpa = Number((((targetCgpa * totalDegreeSems) - sumSgpa) / remainingSems).toFixed(2));
  }

  let engineStatus = "On Track";
  let statusColor = "text-accentGreen";
  
  if (requiredSgpa > 10) {
    engineStatus = "Mathematically Impossible";
    statusColor = "text-accentRed";
  } else if (requiredSgpa <= 0 && totalCompleted > 0) {
    engineStatus = "Target Secured";
    statusColor = "text-accentBlue";
  } else if (requiredSgpa > currentCgpa) {
    engineStatus = "Needs Improvement";
    statusColor = "text-yellow-400";
  }

  const handleUpdateSettings = async (newTarget: number, newTotal: number) => {
    if (!user?.uid) return;
    await setDoc(doc(db, `users/${user.uid}/settings/grades`), {
      targetCgpa: newTarget,
      totalDegreeSems: newTotal
    }, { merge: true });
  };

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !newSemName || !newSgpa) return;

    const sgpaNum = Number(newSgpa);
    if (sgpaNum < 0 || sgpaNum > 10) {
      toast.error("SGPA must be between 0 and 10");
      return;
    }

    const toastId = toast.loading("Adding semester record...");
    try {
      await addDoc(collection(db, `users/${user.uid}/semesters_grades`), {
        name: newSemName,
        sgpa: sgpaNum,
        timestamp: serverTimestamp()
      });
      setNewSemName("");
      setNewSgpa("");
      toast.success("Semester added!", { id: toastId });
    } catch (error) {
      toast.error("Failed to add semester", { id: toastId });
    }
  };

  const handleDeleteSemester = async (id: string) => {
    if (!user?.uid) return;
    if (!window.confirm("Delete this semester record?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/semesters_grades`, id));
      toast.success("Record deleted");
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  return (
    <main className="min-h-screen text-white p-6 md:p-12 font-sans flex flex-col items-center">
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accentBlue/20 rounded-2xl text-accentBlue">
            <GraduationCap size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Predictive Grades</h1>
            <p className="text-gray-400 mt-1">SGPA tracking and CGPA forecasting engine</p>
          </div>
        </div>
      </motion.div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="md:col-span-2 flex flex-col gap-6">
          <div className="glass-card p-8 flex flex-col justify-center relative overflow-hidden rounded-[32px]">
            <div className={`absolute top-0 right-0 w-64 h-64 opacity-20 blur-[100px] rounded-full pointer-events-none ${
              requiredSgpa > 10 ? 'bg-accentRed' : requiredSgpa <= 0 ? 'bg-accentBlue' : 'bg-accentGreen'
            }`}></div>

            <div className="flex justify-between items-start mb-8 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                  <Calculator size={20} className="text-accentBlue" />
                  Engine Output
                </h2>
                <p className={`text-sm font-bold mt-2 ${statusColor}`}>{engineStatus}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Current CGPA</p>
                <p className="text-5xl font-extrabold">{currentCgpa > 0 ? currentCgpa : '0.00'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 z-10 border-t border-white/10 pt-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Target CGPA</p>
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-accentBlue" />
                  <input 
                    type="number" step="0.01" min="0" max="10"
                    value={targetCgpa}
                    onChange={(e) => handleUpdateSettings(Number(e.target.value), totalDegreeSems)}
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1 w-24 text-xl font-bold focus:outline-none focus:border-accentBlue"
                  />
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Required SGPA (Next {remainingSems} Sems)</p>
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className={statusColor} />
                  <span className={`text-3xl font-extrabold ${statusColor}`}>
                    {remainingSems === 0 ? "DONE" : requiredSgpa > 10 ? "> 10.0" : requiredSgpa <= 0 ? "0.00" : requiredSgpa}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-4">Semester Records</h3>
            {semesters.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No semesters logged yet.</p>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {semesters.map((sem, index) => (
                    <motion.div 
                      key={sem.id} 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4"
                    >
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Record {index + 1}</p>
                        <p className="font-bold text-lg">{sem.name}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-extrabold text-accentBlue">{sem.sgpa.toFixed(2)}</span>
                        <button onClick={() => handleDeleteSemester(sem.id)} className="text-gray-500 hover:text-accentRed transition-colors p-2 bg-black/50 rounded-full">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="flex flex-col gap-6">
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-4">Log New SGPA</h3>
            <form onSubmit={handleAddSemester} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Semester Name</label>
                <input 
                  type="text" value={newSemName} onChange={(e) => setNewSemName(e.target.value)} 
                  required placeholder="E.g., Semester 3" 
                  className="w-full bg-black border border-white/10 rounded-full px-4 py-3 text-white focus:outline-none focus:border-accentBlue" 
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Achieved SGPA</label>
                <input 
                  type="number" step="0.01" min="0" max="10" 
                  value={newSgpa} onChange={(e) => setNewSgpa(e.target.value)} 
                  required placeholder="8.5" 
                  className="w-full bg-black border border-white/10 rounded-full px-4 py-3 text-white focus:outline-none focus:border-accentBlue" 
                />
              </div>
              <button type="submit" className="w-full bg-accentBlue text-white py-3 rounded-full font-bold mt-2 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                <Plus size={18} /> Add Record
              </button>
            </form>
          </div>

          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-4 text-gray-200">Degree Settings</h3>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Total Degree Semesters</label>
              <select 
                value={totalDegreeSems}
                onChange={(e) => handleUpdateSettings(targetCgpa, Number(e.target.value))}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentBlue appearance-none"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1} Semesters</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">Adjust this depending on the length of your program.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}