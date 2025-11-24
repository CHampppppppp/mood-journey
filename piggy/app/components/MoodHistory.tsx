import { Mood } from '@/lib/actions';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  blissful: '🥰',
  tired: '😴',
  annoyed: '😫',
  angry: '😠',
  depressed: '😔',
};

export default function MoodHistory({ moods }: { moods: Mood[] }) {
  return (
    <div className="w-full px-2">
      <h2 className="text-lg font-bold text-gray-800 mb-4 px-2 opacity-50">近期心情</h2>
      <div className="space-y-3">
        {moods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-4xl mb-2">🍃</span>
            <p>还没有记录哦</p>
          </div>
        ) : (
          moods.map((mood) => (
            <div key={mood.id} className="bg-white p-4 rounded-2xl shadow-sm border border-pink-50 flex gap-4 items-center transform transition-all hover:scale-[1.02] active:scale-[0.98]">
              <div className="text-4xl flex items-center justify-center bg-pink-50 w-14 h-14 rounded-2xl shrink-0">
                {MOOD_EMOJIS[mood.mood] || '😐'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-800 truncate">
                    {format(new Date(mood.created_at), 'M月d日', { locale: zhCN })}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {format(new Date(mood.created_at), 'HH:mm')}
                  </span>
                </div>
                <div className="flex gap-1 mb-2">
                    {Array.from({ length: mood.intensity + 1 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    ))}
                </div>
                {mood.note && (
                    <p className="text-gray-600 text-sm truncate">{mood.note}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

