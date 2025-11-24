import { getMoods } from '@/lib/actions';
import MoodForm from './components/MoodForm';
import MoodHistory from './components/MoodHistory';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const moods = await getMoods();

  return (
    <div className="min-h-screen bg-pink-50 py-10 px-4">
      <main className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Piggy's Mood Diary 🐷</h1>
          <p className="text-pink-600 font-medium">
            专属于宝宝的心情小窝 ❤️
          </p>
        </div>
        
        <MoodForm />
        
        <MoodHistory moods={moods} />
      </main>
    </div>
  );
}
