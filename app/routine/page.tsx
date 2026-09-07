'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CalendarDays, Plus, Trash2, Clock, MapPin, Save } from 'lucide-react';
import Link from 'next/link';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

interface ClassItem {
  id: string;
  time: string;
  endTime: string;
  subject: string;
  room: string;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ManageRoutine() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [routine, setRoutine] = useState<Record<string, ClassItem[]>>({});
  
  // Form State
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    const routineRef = doc(db, `users/${user.uid}/settings/routine`);
    
    const unsubscribe = onSnapshot(routineRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoutine(docSnap.data().schedule || {});
      } else {
        setRoutine({});
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    const newClass: ClassItem = {
      id: Date.now().toString(),
      subject: subject.toUpperCase(),
      room,
      time,
      endTime
    };

    const currentDayClasses = routine[selectedDay] || [];
    const updatedRoutine = {
      ...routine,
      [selectedDay]: [...currentDayClasses, newClass].sort((a, b) => a.time.localeCompare(b.time))
    };

    const toastId = toast.loading("Saving class...");
    try {
      await setDoc(doc(db, `users/${user.uid}/settings/routine`), { schedule: updatedRoutine }, { merge: true });
      setSubject(''); setRoom(''); setTime(''); setEndTime('');
      toast.success("Class added!", { id: toastId });
    } catch (error) {
      toast.error("Failed to add class", { id: toastId });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!user?.uid) return;
    
    const updatedDayClasses = (routine[selectedDay] || []).filter(c => c.id !== classId);
    const updatedRoutine = { ...routine, [selectedDay]: updatedDayClasses };

    try {
      await setDoc(doc(db, `users/${user.uid}/settings/routine`), { schedule: updatedRoutine }, { merge: true });
      toast.success("Class removed");
    } catch (error) {
      toast.error("Failed to remove class");
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
            <CalendarDays size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Manage Routine</h1>
            <p className="text-gray-400 mt-1">Build your weekly schedule</p>
          </div>
        </div>
      </motion.div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Editor Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 rounded-[32px] h-fit">
          <h2 className="text-xl font-bold mb-4">Add to {selectedDay}</h2>
          <form onSubmit={handleAddClass} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Subject Name</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="e.g. OOPS" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentBlue" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Room / Location</label>
              <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} required placeholder="e.g. Room 204" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentBlue" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Start Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentBlue [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">End Time</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentBlue [color-scheme:dark]" />
              </div>
            </div>
            <button type="submit" className="w-full bg-accentBlue text-white py-3 rounded-full font-bold mt-2 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
              <Plus size={18} /> Add Class
            </button>
          </form>
        </motion.div>

        {/* Schedule Preview */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
            {WEEK_DAYS.map((day) => (
              <button
                key={day} onClick={() => setSelectedDay(day)}
                className={`px-6 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${selectedDay === day ? 'bg-accentBlue text-white' : 'bg-surfaceGlass border border-white/5 text-gray-400 hover:text-white'}`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="glass-card p-6 rounded-[32px] min-h-[400px]">
            <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-4">{selectedDay}'s Classes</h3>
            
            {(!routine[selectedDay] || routine[selectedDay].length === 0) ? (
              <p className="text-gray-500 text-center py-8">No classes scheduled for {selectedDay}.</p>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {routine[selectedDay].map((cls) => (
                    <motion.div key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4 group">
                      <div>
                        <h4 className="font-bold text-lg">{cls.subject}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Clock size={14}/> {cls.time} - {cls.endTime}</span>
                          <span className="flex items-center gap-1"><MapPin size={14}/> {cls.room}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteClass(cls.id)} className="text-gray-500 hover:text-accentRed transition-colors p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}