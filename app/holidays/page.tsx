'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowLeft, Palmtree, Plus, Trash2, X, DownloadCloud } from 'lucide-react';
import { format, isBefore, isSameDay, parseISO } from 'date-fns';
import Link from 'next/link';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';

interface HolidayItem {
  id: string;
  date: string;
  name: string;
}

export default function Holidays() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setCurrentTime(new Date());

    // Listen to Firebase for Holidays
    const holidaysRef = collection(db, `users/manjil_student_os/holidays`);
    const unsubscribe = onSnapshot(holidaysRef, (snapshot) => {
      const data: HolidayItem[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as HolidayItem);
      });
      
      // Sort holidays chronologically
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setHolidays(data);
    });

    return () => unsubscribe();
  }, []);

  // --- BATCH IMPORT ASSAM 2026 HOLIDAYS ---
  const handleSyncOfficialHolidays = async () => {
    const isConfirmed = window.confirm("This will import the official Assam 2026 holidays into your database. Proceed?");
    if (!isConfirmed) return;

    const toastId = toast.loading("Syncing official holidays...");
    
    const officialHolidays = [
      { date: "2026-01-14", name: "Magh Bihu & Tusu Puja" },
      { date: "2026-01-15", name: "Magh Bihu" },
      { date: "2026-01-23", name: "Netaji's Birthday" },
      { date: "2026-01-26", name: "Republic Day" },
      { date: "2026-01-27", name: "Gwthar Bathou San" },
      { date: "2026-01-31", name: "Me-Dam-Me-Phi" },
      { date: "2026-02-01", name: "Bir Chilaray Divas" },
      { date: "2026-03-03", name: "Dol Jatra" },
      { date: "2026-03-21", name: "Id-Ul-Fitr" },
      { date: "2026-04-03", name: "Good Friday" },
      { date: "2026-04-14", name: "Bohag Bihu" },
      { date: "2026-04-15", name: "Bohag Bihu" },
      { date: "2026-04-16", name: "Bohag Bihu" },
      { date: "2026-04-18", name: "Tithi of Damodar Deva" },
      { date: "2026-04-21", name: "Sati Sadhini Divas" },
      { date: "2026-05-01", name: "May Day & Budha Purnima" },
      { date: "2026-05-27", name: "Id-ul-Zuha" },
      { date: "2026-06-01", name: "Janmotsav of Sri Sri Madhabdeva" },
      { date: "2026-08-15", name: "Independence Day" },
      { date: "2026-09-01", name: "Tirubhav Tithi of Sri Sri Madhabdeva" },
      { date: "2026-09-04", name: "Janmastomi" },
      { date: "2026-09-12", name: "Tirubhav Tithi of Srimanta Sankardeva" },
      { date: "2026-09-21", name: "Janmotsav of Srimanta Sankardeva" },
      { date: "2026-09-22", name: "Karam Puja" },
      { date: "2026-10-02", name: "Birthday of Mahatma Gandhi" },
      { date: "2026-10-18", name: "Kati Bihu & Durga Puja" },
      { date: "2026-10-19", name: "Durga Puja & Vijaya Dashomi" },
      { date: "2026-10-20", name: "Durga Puja & Vijaya Dashomi" },
      { date: "2026-10-21", name: "Durga Puja & Vijaya Dashomi" },
      { date: "2026-10-25", name: "Lakshmi Puja (Half Holiday)" },
      { date: "2026-11-08", name: "Kali Puja & Diwali" },
      { date: "2026-11-11", name: "Bhatri Dwitiya" },
      { date: "2026-11-15", name: "Chhath Puja" },
      { date: "2026-11-24", name: "Guru Nanak's Birthday & Lachit Divas" },
      { date: "2026-12-02", name: "Asom Divas (Su-Ka-Pha Divas)" },
      { date: "2026-12-25", name: "Christmas Day" }
    ];

    try {
      const batch = writeBatch(db);
      officialHolidays.forEach((holiday) => {
        const docRef = doc(collection(db, `users/manjil_student_os/holidays`));
        batch.set(docRef, holiday);
      });
      
      await batch.commit();
      toast.success("Holidays synced successfully!", { id: toastId });
    } catch (error) {
      toast.error("Failed to sync holidays", { id: toastId });
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newName.trim()) return;

    const toastId = toast.loading("Adding holiday...");
    try {
      await addDoc(collection(db, `users/manjil_student_os/holidays`), {
        date: newDate,
        name: newName.trim()
      });
      setIsAddModalOpen(false);
      setNewDate("");
      setNewName("");
      toast.success("Holiday added!", { id: toastId });
    } catch (error) {
      toast.error("Failed to add holiday", { id: toastId });
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    
    const toastId = toast.loading(`Deleting ${name}...`);
    try {
      await deleteDoc(doc(db, `users/manjil_student_os/holidays`, id));
      toast.success("Holiday deleted", { id: toastId });
    } catch (error) {
      toast.error("Failed to delete", { id: toastId });
    }
  };

  if (!currentTime) return null;

  // Find the exact next upcoming holiday
  const upcomingHolidayIndex = holidays.findIndex((holiday) => {
    const holidayDate = parseISO(holiday.date);
    return isSameDay(holidayDate, currentTime) || isBefore(currentTime, holidayDate);
  });

  return (
    <main className="min-h-screen text-white p-6 md:p-12 font-sans flex flex-col items-center">
      
      {/* Navigation & Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accentBlue/20 rounded-2xl text-accentBlue">
              <Palmtree size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Holidays</h1>
              <p className="text-gray-400 mt-1">Manage your non-working days</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {/* ONE-TIME SYNC BUTTON */}
            {holidays.length === 0 && (
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleSyncOfficialHolidays}
                className="flex items-center gap-2 bg-[#FF9F0A] text-black py-3 px-6 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(255,159,10,0.3)] hover:shadow-[0_0_25px_rgba(255,159,10,0.5)]"
              >
                <DownloadCloud size={20} /> Sync 2026 Holidays
              </motion.button>
            )}

            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-accentBlue text-white py-3 px-6 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(10,132,255,0.3)] hover:shadow-[0_0_25px_rgba(10,132,255,0.5)]"
            >
              <Plus size={20} /> Add Custom
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* The Holiday List */}
      <div className="w-full max-w-4xl">
        {holidays.length === 0 ? (
          <div className="glass-card p-12 text-center text-gray-400">
            No holidays added yet. Click "Sync 2026 Holidays" to automatically import the official calendar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holidays.map((holiday, index) => {
              const holidayDate = parseISO(holiday.date);
              const isPast = isBefore(holidayDate, currentTime) && !isSameDay(holidayDate, currentTime);
              const isNext = index === upcomingHolidayIndex;

              return (
                <motion.div
                  key={holiday.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.02 }}
                  className={`
                    p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between group
                    ${isNext ? 'bg-accentBlue/10 border-accentBlue shadow-[0_0_20px_rgba(10,132,255,0.2)]' : isPast ? 'bg-surfaceGlass border-white/5 opacity-50' : 'bg-surfaceGlass border-white/10 hover:border-white/20'}
                  `}
                >
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <h3 className={`text-xl font-bold ${isPast ? 'text-gray-500' : 'text-white'}`}>
                        {holiday.name}
                      </h3>
                      <p className="text-sm mt-1 flex items-center gap-2 text-gray-400">
                        <Calendar size={14} /> {format(holidayDate, 'EEEE, MMMM do, yyyy')}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                      className="text-gray-500 hover:text-accentRed transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  {isNext && (
                    <div className="mt-4 inline-block self-start px-3 py-1 bg-accentBlue rounded-full text-xs font-bold text-white tracking-wide">
                      UPCOMING
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Holiday Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card w-full max-w-md bg-surface p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add Custom Holiday</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleAddHoliday} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Holiday Name</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="E.g., Diwali, Bohag Bihu" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentBlue" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Date</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accentBlue [color-scheme:dark]" />
                </div>
                <button type="submit" className="w-full bg-accentBlue text-white py-3 rounded-xl font-bold mt-2 hover:bg-blue-600 transition-colors">
                  Save Holiday
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}