'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar as CalendarIcon, List as ListIcon } from 'lucide-react';
import MoodCalendar from './MoodCalendar';
import MoodHistory from './MoodHistory';
import MoodForm from './MoodForm';
import { Mood } from '@/lib/actions';

export default function MoodDashboard({ moods }: { moods: Mood[] }) {
  const [view, setView] = useState<'calendar' | 'history'>('calendar');
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="h-screen w-full bg-gray-50 sm:bg-pink-100 sm:flex sm:items-center sm:justify-center overflow-hidden">
      <div className="w-full h-full sm:w-[420px] sm:h-[850px] sm:max-h-[95vh] bg-pink-50 flex flex-col overflow-hidden relative sm:rounded-[30px] sm:shadow-2xl sm:border-[8px] sm:border-white sm:ring-1 sm:ring-gray-900/5">
        {/* Header */}
        <header className="flex-none pt-8 pb-2 px-6 text-center bg-gradient-to-b from-pink-50 to-transparent z-10">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Piggy's Mood Diary 🐷</h1>
          <p className="text-xs text-pink-400 mt-1 font-medium">记录老婆每一天～</p>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-2 pb-28 scrollbar-hide">
          <AnimatePresence mode="wait">
            {view === 'calendar' ? (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <MoodCalendar moods={moods} />
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="pb-20"
              >
                <MoodHistory moods={moods} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Controls */}
        <div className="flex-none absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4 z-20 pointer-events-none">

          {/* FAB */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddOpen(true)}
            className="pointer-events-auto w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full shadow-xl shadow-pink-500/40 flex items-center justify-center text-white border-4 border-pink-50"
          >
            <Plus size={32} strokeWidth={3} />
          </motion.button>

          {/* Switch Tabs */}
          <div className="pointer-events-auto bg-white/90 backdrop-blur-xl shadow-lg rounded-full p-1.5 flex gap-2 border border-pink-100">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${view === 'calendar'
                  ? 'bg-pink-100 text-pink-600 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <CalendarIcon size={18} />
              <span className="text-sm">日历</span>
            </button>
            <button
              onClick={() => setView('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${view === 'history'
                  ? 'bg-pink-100 text-pink-600 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <ListIcon size={18} />
              <span className="text-sm">列表</span>
            </button>
          </div>
        </div>

        {/* Add Mood Modal */}
        <AnimatePresence>
          {isAddOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAddOpen(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden opacity-50" />
                <div className="flex justify-between items-center mb-4 sm:hidden">
                  <h3 className="text-lg font-bold text-gray-800">记录心情</h3>
                  <button onClick={() => setIsAddOpen(false)} className="text-gray-400 p-2">
                    关闭
                  </button>
                </div>
                <MoodForm onSuccess={() => setIsAddOpen(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

