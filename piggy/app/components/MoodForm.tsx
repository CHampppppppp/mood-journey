'use client';

import { useState } from 'react';
import { saveMood } from '@/lib/actions';

const MOODS = [
  { label: '开心', emoji: '😊', value: 'happy' },
  { label: '幸福', emoji: '🥰', value: 'blissful' },
  { label: '累', emoji: '😴', value: 'tired' },
  { label: '烦躁', emoji: '😫', value: 'annoyed' },
  { label: '生气', emoji: '😠', value: 'angry' },
  { label: '沮丧', emoji: '😔', value: 'depressed' },
];

export default function MoodForm() {
  const [selectedMood, setSelectedMood] = useState('');
  const [intensity, setIntensity] = useState(0);

  return (
    <form action={saveMood} className="space-y-6 bg-white p-6 rounded-2xl shadow-md max-w-md w-full mx-auto border border-pink-100">
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-3">今天心情怎么样呀？Piggy~</label>
        <div className="grid grid-cols-3 gap-3">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setSelectedMood(m.value)}
              className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                selectedMood === m.value
                  ? 'bg-pink-100 border-pink-500 scale-105'
                  : 'bg-gray-50 border-gray-200 hover:bg-pink-50'
              }`}
            >
              <span className="text-3xl mb-1">{m.emoji}</span>
              <span className="text-sm text-gray-600">{m.label}</span>
            </button>
          ))}
        </div>
        <input type="hidden" name="mood" value={selectedMood} />
      </div>

      {selectedMood && (
        <div className="animate-fade-in">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            强烈程度 (0-3)
          </label>
          <div className="flex justify-between px-2">
            {[0, 1, 2, 3].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setIntensity(level)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                  intensity === level
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-400 hover:bg-pink-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <input type="hidden" name="intensity" value={intensity} />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          想说点什么吗？
        </label>
        <textarea
          name="note"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-500 outline-none transition-all"
          placeholder="记录一下今天发生的小事..."
        />
      </div>

      <button
        type="submit"
        disabled={!selectedMood}
        className="w-full py-3 px-4 bg-pink-500 text-white font-semibold rounded-xl shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        记录心情 ❤️
      </button>
    </form>
  );
}

