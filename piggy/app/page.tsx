import { getMoods } from '@/lib/actions';
import MoodDashboard from './components/MoodDashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const moods = await getMoods();

  return <MoodDashboard moods={moods} />;
}
