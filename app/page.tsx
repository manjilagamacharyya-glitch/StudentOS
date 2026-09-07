'use client';

import './globals.css';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, XCircle, Calendar, Clock, AlertTriangle, 
  Settings, Plus, Trash2, Edit2, X, Save, MapPin, BarChart3, GraduationCap
} from 'lucide-react';
import { holidayList2026 } from '../data/semesterData';
import { format } from 'date-fns';
import { db, auth } from '../lib/firebase';
import { 
  collection, addDoc, doc, setDoc, increment, serverTimestamp, 
  onSnapshot, writeBatch, getDocs, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

interface ClassRoutineItem {
  id: string;
  time: string;
  endTime: string;
  subject: string;
  room: string;
}

interface HolidayItem {
  date: string;
  name: string;
}

interface SubjectData {
  id: string;
  attended: number;
  total: number;
}

const calculateAttendanceStats = (attended: number, total: number) => {
  if (total === 0) return { percent: 100, safeSkips: 0, required: 0, isSafe: true };
  
  const percent = Math.round((attended / total) * 100);
  const isSafe = percent >= 75;
  let safeSkips = 0;
  let required = 0;

  if (isSafe) {
    safeSkips = Math.floor((attended / 0.75) - total);
  } else {
    required = Math.ceil((3 * total) - (4 * attended));
  }

  return { percent, safeSkips, required, isSafe };
};

export default function Dashboard() {
  const { user } = useAuth();
  
  const [currentClass, setCurrentClass] = useState<ClassRoutineItem | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [holidayName, setHolidayName] = useState<string>("");
  const [subjectsData, setSubjectsData] = useState<SubjectData[]>([]);
  const [dynamicRoutine, setDynamicRoutine] = useState<Record<string, ClassRoutineItem[]>>({});

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editAttended, setEditAttended] = useState<number>(0);
  const [editTotal, setEditTotal] = useState<number>(0);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedDay, setSelectedDay] = useState<string>("Monday");

  useEffect(() => {
    const initialDayStr = format(new Date(), 'EEEE');
    setSelectedDay(weekDays.includes(initialDayStr) ? initialDayStr : 'Monday');
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const todayStr = format(currentTime, 'yyyy-MM-dd');
    const dayOfWeek = format(currentTime, 'EEEE'); 
    const currentHourMin = format(currentTime, 'HH:mm');

    const holidayMatch = holidayList2026.find((h: HolidayItem) => h.date === todayStr);
    if (holidayMatch) {
      setIsHoliday(true);
      setHolidayName(holidayMatch.name);
      return;
    } else {
      setIsHoliday(false);
    }

    const todaysRoutine = dynamicRoutine[dayOfWeek] || [];
    const activeClass = todaysRoutine.find((c: ClassRoutineItem) => {
      return currentHourMin >= c.time && currentHourMin < c.endTime;
    });

    setCurrentClass(activeClass || null);
  }, [currentTime]);

  // --- DYNAMIC DATABASE LISTENER ---
  useEffect(() => {
    if (!user?.uid) return;

    // 1. Subjects Listener
    const subjectsRef = collection(db, `users/${user.uid}/semesters/sem_3/subjects`);
    const unsubscribeSubjects = onSnapshot(subjectsRef, (snapshot) => {
      const data: SubjectData[] = [];
      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          attended: doc.data().attended || 0,
          total: doc.data().total || 0,
        });
      });
      setSubjectsData(data);
    });

    // 2. Routine Listener (New)
    const routineRef = doc(db, `users/${user.uid}/settings/routine`);
    const unsubscribeRoutine = onSnapshot(routineRef, (docSnap) => {
      if (docSnap.exists()) {
        setDynamicRoutine(docSnap.data().schedule || {});
      } else {
        setDynamicRoutine({});
      }
    });

    // 3. Cleanup both listeners on unmount
    return () => {
      unsubscribeSubjects();
      unsubscribeRoutine();
    };
  }, [user?.uid]);

  // --- DYNAMIC DATABASE FUNCTIONS ---
  const handleAttendance = async (subjectId: string, status: 'present' | 'absent') => {
    if (!user?.uid) return;
    const todayStr = format(currentTime, 'yyyy-MM-dd');
    const toastId = toast.loading(`Logging ${status} for ${subjectId}...`);

    try {
      await addDoc(collection(db, `users/${user.uid}/semesters/sem_3/logs`), {
        date: todayStr,
        subject: subjectId,
        status: status,
        timestamp: serverTimestamp()
      });

      const subjectRef = doc(db, `users/${user.uid}/semesters/sem_3/subjects`, subjectId);
      await setDoc(subjectRef, {
        total: increment(1),
        attended: increment(status === 'present' ? 1 : 0)
      }, { merge: true });

      toast.success(`Successfully marked ${status}!`, { id: toastId, description: `${subjectId} attendance recorded for ${todayStr}` });
    } catch (error) {
      console.error("Error logging attendance: ", error);
      toast.error("Failed to log attendance", { id: toastId, description: "Please check your connection and try again." });
    }
  };

  const handleSemesterReset = async () => {
    if (!user?.uid) return;
    const isConfirmed = window.confirm("WARNING: This will reset all your attendance data for the current semester back to zero. Are you sure you want to proceed?");
    if (!isConfirmed) return;
    const toastId = toast.loading("Resetting semester data...");

    try {
      const subjectsRef = collection(db, `users/${user.uid}/semesters/sem_3/subjects`);
      const snapshot = await getDocs(subjectsRef);
      const batch = writeBatch(db);
      
      snapshot.forEach((subjectDoc) => {
        batch.update(subjectDoc.ref, { attended: 0, total: 0 });
      });

      await batch.commit();
      toast.success("Semester reset successfully!", { id: toastId, description: "All subject attendance counts are back to zero." });
    } catch (error) {
      console.error("Error resetting semester: ", error);
      toast.error("Failed to reset semester", { id: toastId });
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !newSubjectName.trim()) return;

    const subjectId = newSubjectName.trim().toUpperCase();
    const toastId = toast.loading(`Adding ${subjectId}...`);

    try {
      await setDoc(doc(db, `users/${user.uid}/semesters/sem_3/subjects`, subjectId), {
        attended: 0,
        total: 0
      });
      setNewSubjectName("");
      toast.success(`Subject added!`, { id: toastId });
    } catch (error) {
      toast.error("Failed to add subject", { id: toastId });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!user?.uid) return;
    if (!window.confirm(`Are you sure you want to delete ${subjectId}? This will remove its analytics card.`)) return;
    
    const toastId = toast.loading(`Deleting ${subjectId}...`);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/semesters/sem_3/subjects`, subjectId));
      toast.success(`Subject deleted!`, { id: toastId });
    } catch (error) {
      toast.error("Failed to delete subject", { id: toastId });
    }
  };

  const startEditing = (subject: SubjectData) => {
    setEditingSubjectId(subject.id);
    setEditAttended(subject.attended);
    setEditTotal(subject.total);
  };

  const saveEditedSubject = async (subjectId: string) => {
    if (!user?.uid) return;
    const toastId = toast.loading(`Updating ${subjectId}...`);
    try {
      await updateDoc(doc(db, `users/${user.uid}/semesters/sem_3/subjects`, subjectId), {
        attended: Number(editAttended),
        total: Number(editTotal)
      });
      setEditingSubjectId(null);
      toast.success(`Updated successfully!`, { id: toastId });
    } catch (error) {
      toast.error("Failed to update subject", { id: toastId });
    }
  };

  return (
    <main className="min-h-screen text-white p-6 md:p-12 pb-32 font-sans flex flex-col items-center relative overflow-hidden">
      
      {/* --- HEADER (Centered & Branded) --- */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-5xl mb-12 flex flex-col items-center text-center mt-4"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500">
          StudentOS
        </h1>
        <p className="text-gray-400 mt-2 flex items-center justify-center gap-2 font-medium">
          <Calendar size={16} /> {format(currentTime, 'EEEE, MMMM do, yyyy')}
        </p>
        <button 
          onClick={() => signOut(auth)}
          className="mt-4 text-xs font-bold text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 py-1.5 px-4 rounded-full border border-white/10"
        >
          Sign Out
        </button>
      </motion.div>

      {/* --- HAPPENING NOW SECTION --- */}
      <div className="w-full max-w-5xl mb-12 relative isolate">
        <div className="absolute inset-0 bg-accentBlue/10 blur-[100px] -z-10 rounded-full"></div>
        
        <h2 className="text-xl font-bold mb-6 text-gray-200">Happening Now</h2>
        {isHoliday ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 text-center rounded-[32px]">
            <h3 className="text-3xl font-bold text-accentBlue mb-2">Holiday!</h3>
            <p className="text-lg text-gray-300">Enjoy your day off for {holidayName}. No attendance tracking today.</p>
          </motion.div>
        ) : currentClass ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 flex flex-col md:flex-row justify-between items-center gap-6 rounded-[32px]">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-accentBlue mb-2 font-medium">
                <Clock size={18} />
                <span>{currentClass.time} - {currentClass.endTime}</span>
              </div>
              <h3 className="text-4xl font-extrabold mb-1">{currentClass.subject}</h3>
              <p className="text-xl text-gray-400">{currentClass.room}</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAttendance(currentClass.subject, 'present')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-surfaceGlass border border-accentGreen/30 hover:bg-accentGreen/10 text-accentGreen py-4 px-8 rounded-full font-bold text-lg transition-colors shadow-[0_0_20px_rgba(50,215,75,0.1)]">
                <CheckCircle2 size={24} /> Present
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAttendance(currentClass.subject, 'absent')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-surfaceGlass border border-accentRed/30 hover:bg-accentRed/10 text-accentRed py-4 px-8 rounded-full font-bold text-lg transition-colors shadow-[0_0_20px_rgba(255,69,58,0.1)]">
                <XCircle size={24} /> Absent
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center rounded-[32px]">
            <p className="text-xl text-gray-400">No classes at the moment. Take a breather.</p>
          </motion.div>
        )}
      </div>

      {/* --- WEEKLY TIMETABLE SECTION --- */}
      <div className="w-full max-w-5xl mb-12">
        <h2 className="text-xl font-bold mb-6 text-gray-200">Weekly Routine</h2>
        
        <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide">
          {weekDays.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-6 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${
                selectedDay === day 
                  ? 'bg-accentBlue text-white shadow-[0_0_15px_rgba(10,132,255,0.3)]' 
                  : 'bg-surfaceGlass border border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <motion.div 
          key={selectedDay} 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {(!dynamicRoutine[selectedDay] || dynamicRoutine[selectedDay].length === 0) ? (
            <div className="col-span-full glass-card p-8 text-center text-gray-400 rounded-3xl">
              No classes scheduled for {selectedDay}.
            </div>
          ) : (
            dynamicRoutine[selectedDay].map((cls: ClassRoutineItem) => {
              const isCurrent = currentClass?.id === cls.id;
              return (
                <motion.div 
                  key={cls.id} 
                  whileHover={{ scale: 1.02, y: -5, boxShadow: "0px 20px 40px rgba(0,0,0,0.4)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`glass-card p-6 rounded-3xl flex flex-col transition-colors group relative overflow-hidden cursor-pointer ${isCurrent ? 'border-accentGreen shadow-[0_0_15px_rgba(50,215,75,0.15)]' : 'border-white/5'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
                  
                  {isCurrent && <div className="absolute inset-0 bg-accentGreen/10 blur-3xl -z-10 rounded-full"></div>}

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className={`text-sm font-bold flex items-center gap-1.5 ${isCurrent ? 'text-accentGreen' : 'text-accentBlue'}`}>
                      <Clock size={14} /> {cls.time} - {cls.endTime}
                    </span>
                    {isCurrent && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accentGreen/20 text-accentGreen uppercase tracking-wider">Now</span>}
                  </div>
                  
                  <h3 className="text-2xl font-extrabold text-white mb-2 relative z-10">{cls.subject}</h3>
                  
                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center text-gray-400 text-sm gap-1.5 relative z-10">
                    <MapPin size={14} /> {cls.room}
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      {/* --- ANALYTICS & 75% TRACKER --- */}
      <div className="w-full max-w-5xl mb-12">
        <h2 className="text-xl font-bold mb-6 text-gray-200">Subject Analytics</h2>
        
        {subjectsData.length === 0 ? (
          <div className="text-gray-500 italic">No attendance data logged yet. Open "Manage Subjects" to add your classes.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectsData.map((subject) => {
              const stats = calculateAttendanceStats(subject.attended, subject.total);
              const chartData = [
                { name: 'Attended', value: subject.attended },
                { name: 'Missed', value: subject.total - subject.attended }
              ];
              const ringColor = stats.isSafe ? '#32D74B' : '#FF453A';

              return (
                <motion.div 
                  key={subject.id} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                  whileHover={{ scale: 1.02, y: -5, boxShadow: "0px 20px 40px rgba(0,0,0,0.4)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="glass-card rounded-[32px] p-6 flex flex-col items-center relative overflow-hidden group cursor-pointer isolate"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
                  
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[80px] opacity-20 -z-10 rounded-full ${stats.isSafe ? 'bg-accentGreen' : 'bg-accentRed'}`}></div>
                  
                  <h3 className="text-lg font-bold text-white w-full text-center mb-4 relative z-10">{subject.id}</h3>
                  
                  <div className="w-40 h-40 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={75} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                          <Cell key="cell-0" fill={ringColor} />
                          <Cell key="cell-1" fill="rgba(255,255,255,0.05)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-extrabold">{stats.percent}%</span>
                      <span className="text-xs text-gray-400">{subject.attended}/{subject.total}</span>
                    </div>
                  </div>

                  <div className="mt-4 w-full rounded-2xl bg-black/40 p-3 text-center border border-white/5 relative z-10">
                    {stats.isSafe ? (
                      <p className="text-sm font-medium text-gray-300">Safe to skip <span className="text-accentGreen font-bold">{stats.safeSkips}</span> classes</p>
                    ) : (
                      <p className="text-sm font-medium text-gray-300 flex items-center justify-center gap-1">
                        <AlertTriangle size={14} className="text-accentRed" />
                        Attend <span className="text-accentRed font-bold">{stats.required}</span> more
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 w-full mt-4 relative z-10">
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleAttendance(subject.id, 'present')}
                      className="flex-1 py-2.5 bg-accentGreen/10 hover:bg-accentGreen/20 text-accentGreen rounded-full text-sm font-bold flex justify-center items-center gap-1 transition-colors border border-accentGreen/20"
                    >
                      <CheckCircle2 size={16} /> Present
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleAttendance(subject.id, 'absent')}
                      className="flex-1 py-2.5 bg-accentRed/10 hover:bg-accentRed/20 text-accentRed rounded-full text-sm font-bold flex justify-center items-center gap-1 transition-colors border border-accentRed/20"
                    >
                      <XCircle size={16} /> Absent
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- FLOATING BOTTOM DOCK --- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <motion.div 
          initial={{ y: 100, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.2 }}
          className="glass-card flex items-center gap-1 p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10"
        >
          <Link href="/analytics">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/10 py-2.5 px-4 md:px-6 rounded-full font-medium transition-colors">
              <BarChart3 size={18} /> <span className="hidden md:inline">Analytics</span>
            </motion.button>
          </Link>
          <Link href="/grades">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/10 py-2.5 px-4 md:px-6 rounded-full font-medium transition-colors">
              <GraduationCap size={18} /> <span className="hidden md:inline">Grades</span>
            </motion.button>
          </Link>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setIsManageModalOpen(true)}
            className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/10 py-2.5 px-4 md:px-6 rounded-full font-medium transition-colors"
          >
            <Settings size={18} /> <span className="hidden md:inline">Subjects</span>
          </motion.button>

          <Link href="/routine">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/10 py-2.5 px-4 md:px-6 rounded-full font-medium transition-colors">
              <Calendar size={18} /> <span className="hidden md:inline">Routine</span>
            </motion.button>
          </Link>
          
          <Link href="/holidays">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/10 py-2.5 px-4 md:px-6 rounded-full font-medium transition-colors">
              <Calendar size={18} /> <span className="hidden md:inline">Holidays</span>
            </motion.button>
          </Link>
          
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleSemesterReset}
            title="Reset Semester"
            className="flex items-center gap-2 text-accentRed hover:bg-accentRed/10 py-2.5 px-4 rounded-full font-medium transition-colors"
          >
            <AlertTriangle size={18} />
          </motion.button>
        </motion.div>
      </div>

      {/* --- MANAGE SUBJECTS MODAL --- */}
      <AnimatePresence>
        {isManageModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden bg-surface rounded-[32px]"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Settings size={24}/> Manage Subjects</h2>
                <button onClick={() => setIsManageModalOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {subjectsData.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No subjects added yet.</p>
                ) : (
                  subjectsData.map((subject) => (
                    <div key={subject.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                      {editingSubjectId === subject.id ? (
                        <div className="flex-1 flex items-center gap-3">
                          <span className="font-bold text-lg w-1/3 truncate">{subject.id}</span>
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" value={editAttended} onChange={(e) => setEditAttended(Number(e.target.value))} className="w-16 bg-black border border-white/20 rounded-lg p-1 text-center focus:outline-none focus:border-accentBlue" />
                            <span className="text-gray-400">/</span>
                            <input type="number" min="0" value={editTotal} onChange={(e) => setEditTotal(Number(e.target.value))} className="w-16 bg-black border border-white/20 rounded-lg p-1 text-center focus:outline-none focus:border-accentBlue" />
                          </div>
                          <button onClick={() => saveEditedSubject(subject.id)} className="ml-auto p-2 bg-accentGreen/20 text-accentGreen rounded-full hover:bg-accentGreen/30"><Save size={18} /></button>
                          <button onClick={() => setEditingSubjectId(null)} className="p-2 bg-gray-500/20 text-gray-300 rounded-full hover:bg-gray-500/30"><X size={18} /></button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 className="font-bold text-lg">{subject.id}</h3>
                            <p className="text-sm text-gray-400">Attended: {subject.attended} / {subject.total}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => startEditing(subject)} className="p-2 bg-white/5 text-gray-300 rounded-full hover:bg-white/10 hover:text-white transition-colors"><Edit2 size={18} /></button>
                            <button onClick={() => handleDeleteSubject(subject.id)} className="p-2 bg-accentRed/10 text-accentRed rounded-full hover:bg-accentRed/20 transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-white/10 bg-black/50">
                <form onSubmit={handleAddSubject} className="flex gap-3">
                  <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="E.g., OOPS, MATHS" className="flex-1 bg-surface border border-white/10 rounded-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accentBlue transition-colors" />
                  <button type="submit" disabled={!newSubjectName.trim()} className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus size={20} /> Add
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}