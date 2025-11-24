'use client';

import { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths, 
  getDay
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Mood } from '@/lib/actions';
import { MOODS } from './MoodForm';

// Define prop type
interface MoodCalendarProps {
  moods: Mood[];
}

export default function MoodCalendar({ moods }: MoodCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  // Get all days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding days for grid alignment (start from Sunday)
  const startDay = getDay(monthStart); // 0 = Sunday, 1 = Monday, ...
  const emptyDays = Array.from({ length: startDay });

  // Helper to find mood for a specific day
  const getMoodForDay = (day: Date) => {
    // Filter moods for this day
    // Note: timestamps might be different, compare YYYY-MM-DD
    // moods are sorted by created_at DESC in the query, so the first one found is the latest
    const dayMood = moods.find(m => isSameDay(new Date(m.created_at), day));
    return dayMood || null;
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getMoodEmoji = (moodValue: string) => {
    const mood = MOODS.find(m => m.value === moodValue);
    return mood ? mood.emoji : '😐';
  };
  
  const getMoodLabel = (moodValue: string) => {
    const mood = MOODS.find(m => m.value === moodValue);
    return mood ? mood.label : '';
  };

      return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 px-2 shrink-0">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-full text-pink-500 transition-colors shadow-sm">
            <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-800">
          {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
        </h2>
        <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-full text-pink-500 transition-colors shadow-sm">
            <ChevronRight size={20} />
        </button>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-1 px-2 shrink-0">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 px-2 flex-1 overflow-y-auto content-start">
        {/* Empty slots for previous month */}
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Days */}
        {daysInMonth.map((day) => {
          const mood = getMoodForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={day.toString()} className="aspect-square relative">
                <button
                  onClick={() => mood && setSelectedMood(mood)}
                  disabled={!mood}
                  className={`w-full h-full rounded-xl flex items-center justify-center text-lg transition-all duration-300
                    ${mood 
                        ? 'bg-white hover:bg-pink-50 hover:scale-105 cursor-pointer shadow-sm border border-pink-100' 
                        : 'text-gray-300 cursor-default'
                    }
                    ${!mood && isToday ? 'bg-white/50 font-bold text-pink-500 ring-1 ring-pink-300 ring-inset shadow-inner' : ''}
                  `}
                >
                  {mood ? (
                      <span className="text-2xl filter drop-shadow-sm transform hover:scale-110 transition-transform">{getMoodEmoji(mood.mood)}</span>
                  ) : (
                      <span className="text-sm">{format(day, 'd')}</span>
                  )}
                </button>
                {mood && mood.intensity >= 2 && (
                    <span className="absolute bottom-1 right-1 w-2 h-2 bg-pink-500 rounded-full border border-white" />
                )}
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedMood && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in" 
            onClick={() => setSelectedMood(null)}
        >
            <div 
                className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-6 transform transition-all scale-100 animate-scale-in border-4 border-pink-100" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-xs text-gray-400 font-medium mb-1">{format(new Date(selectedMood.created_at), 'yyyy年M月d日 HH:mm', { locale: zhCN })}</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1 flex items-center gap-3">
                            <span className="text-4xl">{getMoodEmoji(selectedMood.mood)}</span>
                            {getMoodLabel(selectedMood.mood)}
                        </h3>
                    </div>
                    <button 
                        onClick={() => setSelectedMood(null)} 
                        className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">情绪强度</span>
                    </div>
                    <div className="flex gap-2">
                        {[0, 1, 2, 3].map((level) => (
                            <div 
                                key={level} 
                                className={`flex-1 h-2 rounded-full transition-colors ${
                                    level <= selectedMood.intensity ? 'bg-pink-500' : 'bg-gray-100'
                                }`} 
                            />
                        ))}
                    </div>
                </div>

                {selectedMood.note ? (
                    <div className="bg-pink-50 p-4 rounded-2xl relative">
                        <div className="absolute -top-2 left-4 w-4 h-4 bg-pink-50 rotate-45" />
                        <p className="text-gray-700 text-sm leading-relaxed font-medium">"{selectedMood.note}"</p>
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm italic text-center">没有写下笔记哦 ~</p>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

