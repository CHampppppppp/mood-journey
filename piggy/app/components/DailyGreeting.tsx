'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GREETINGS = [
  "今天也要开开心心的哦 🌸",
  "记得好好照顾自己呀 💕",
  "每一天都是新的开始 ✨",
  "保持快乐，我会陪着你 🐷",
  "愿你今天收获满满的快乐 🌈",
  "做最好的自己！💪",
  "今天也是充满希望的一天 🌟",
  "记得多喝水 💧",
  "你很棒，要相信自己哦 🎈",
  "温柔对待自己 🌺",
  "每个瞬间都值得被珍惜 ⏰",
  "今天想要分享什么心情呢？💭",
  "阳光正好，心情也要好好的 ☀️",
  "慢慢来，一切都来得及 🌿",
];

export default function DailyGreeting() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const today = new Date().toDateString();
    const lastShownDate = sessionStorage.getItem('piggy_greeting_shown');
    return lastShownDate !== today;
  });
  const [todayGreeting] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('piggy_greeting_date');
    const savedGreeting = localStorage.getItem('piggy_greeting_text');

    if (savedDate === today && savedGreeting) {
      return savedGreeting;
    }

    const randomIndex = Math.floor(Math.random() * GREETINGS.length);
    const greeting = GREETINGS[randomIndex];

    localStorage.setItem('piggy_greeting_date', today);
    localStorage.setItem('piggy_greeting_text', greeting);
    return greeting;
  });

  useEffect(() => {
    if (!shouldShow) {
      return;
    }
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [shouldShow]);

  const handleClose = () => {
    setIsVisible(false);
    setShouldShow(false);
    // 记录今天已经显示过
    const today = new Date().toDateString();
    sessionStorage.setItem('piggy_greeting_shown', today);
  };

  if (!shouldShow || !todayGreeting) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative bg-gradient-to-br from-white via-pink-50/50 to-purple-50/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-white/90 ring-1 ring-pink-200/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 10, stiffness: 200 }}
                className="text-6xl mb-4"
              >
                🐷
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3"
              >
                Champ:
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-700 leading-relaxed mb-6"
              >
                {todayGreeting}
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleClose}
                className="cursor-pointer px-6 py-2.5 bg-gradient-to-r from-pink-400 via-pink-500 to-purple-500 text-white font-semibold rounded-full shadow-lg shadow-pink-300/50 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                开始记录今天的心情
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

