import { memo } from 'react';
import { Mood } from '@/lib/actions';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CatSticker, HeartSticker } from './KawaiiStickers';

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  blissful: '🥰',
  tired: '😴',
  annoyed: '😫',
  angry: '😠',
  depressed: '😔',
};

// 优化的单个心情卡片组件 - 漫画风格
const MoodCard = memo(({ mood }: { mood: Mood }) => (
  <div className="cursor-pointer bg-white p-4 rounded-2xl border-3 border-black shadow-[4px_4px_0_#1a1a1a] flex gap-4 items-center transform transition-all hover:shadow-[6px_6px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[2px_2px_0_#1a1a1a] active:translate-x-0 active:translate-y-0">
    {/* Emoji 显示区 */}
    <div className="text-4xl flex items-center justify-center bg-[#ffd6e7] w-14 h-14 rounded-2xl border-3 border-black shrink-0 kawaii-hover">
      {MOOD_EMOJIS[mood.mood] || '😐'}
    </div>
    
    {/* 内容区 */}
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-black truncate">
          {format(new Date(mood.created_at), 'M月d日', { locale: zhCN })}
        </span>
        <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-full">
          {format(new Date(mood.created_at), 'HH:mm')}
        </span>
      </div>
      
      {/* 强度指示器 */}
      <div className="flex gap-1.5 mb-2">
        {Array.from({ length: mood.intensity + 1 }).map((_, i) => (
          <div 
            key={i} 
            className="w-2 h-2 rounded-full bg-[#ffd6e7] border-2 border-black" 
          />
        ))}
      </div>
      
      {/* 笔记 */}
      {mood.note && (
        <p className="text-gray-600 text-sm truncate font-medium">{mood.note}</p>
      )}
    </div>
  </div>
));

MoodCard.displayName = 'MoodCard';

function MoodHistory({ moods }: { moods: Mood[] }) {
  return (
    <div className="w-full px-2">
      {/* 标题 - 漫画风格 */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <HeartSticker size={24} />
        <h2 className="text-lg font-bold manga-text-thin px-4 py-1 bg-[#ffd6e7] rounded-full border-3 border-black shadow-[3px_3px_0_#1a1a1a]">
          近期心情
        </h2>
        <HeartSticker size={24} />
      </div>
      
      <div className="space-y-3">
        {moods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <CatSticker size={100} className="mb-4" />
            <p className="text-black font-bold text-lg">还没有记录哦</p>
            <p className="text-gray-500 text-sm mt-1">点击下方按钮开始记录吧 ♡</p>
          </div>
        ) : (
          moods.map((mood) => <MoodCard key={mood.id} mood={mood} />)
        )}
      </div>
    </div>
  );
}

export default memo(MoodHistory);
