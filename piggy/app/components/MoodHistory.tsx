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
    <div className="w-full max-w-md mx-auto mt-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 px-2">心情足迹 👣</h2>
      <div className="space-y-4">
        {moods.length === 0 ? (
          <p className="text-center text-gray-500 py-8 bg-white rounded-xl">还没有记录哦，快来写第一条吧！</p>
        ) : (
          moods.map((mood) => (
            <div key={mood.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
              <div className="text-4xl flex items-center justify-center bg-pink-50 w-16 h-16 rounded-full">
                {MOOD_EMOJIS[mood.mood] || '😐'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-gray-900">
                      {format(new Date(mood.created_at), 'M月d日', { locale: zhCN })}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {format(new Date(mood.created_at), 'HH:mm')}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: mood.intensity + 1 }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-pink-400" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mt-1 text-sm">{mood.note}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

