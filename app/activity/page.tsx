'use client';

import { useEffect, useState } from 'react';
import { supabase, FiActivity, FiSleep, Walk } from '@/lib/supabase';
import { 
  Activity, 
  TrendingUp, 
  Footprints, 
  Flame, 
  Moon, 
  Target,
  RefreshCw,
  Check,
  AlertCircle,
  Download
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';

export default function ActivityPage() {
  const [activities, setActivities] = useState<FiActivity[]>([]);
  const [sleepData, setSleepData] = useState<FiSleep[]>([]);
  const [recentWalks, setRecentWalks] = useState<Walk[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [weekStats, setWeekStats] = useState({
    avgSteps: 0,
    avgDistance: 0,
    totalWalks: 0,
    goalDays: 0,
  });

  useEffect(() => {
    loadActivityData();
  }, []);

  async function loadActivityData() {
    try {
      setLoading(true);

      // Get last 7 days of activity
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      
      const { data: activityData } = await supabase
        .from('bailey_fi_activity')
        .select('*')
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false });

      const { data: sleepRecords } = await supabase
        .from('bailey_fi_sleep')
        .select('*')
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false });

      const { data: walks } = await supabase
        .from('bailey_walks')
        .select('*')
        .eq('synced_from_fi', true)
        .gte('date', sevenDaysAgo)
        .order('start_time', { ascending: false })
        .limit(10);

      if (activityData) {
        setActivities(activityData);
        calculateWeekStats(activityData);
      }
      
      if (sleepRecords) setSleepData(sleepRecords);
      if (walks) setRecentWalks(walks);

    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateWeekStats(data: FiActivity[]) {
    if (data.length === 0) {
      setWeekStats({ avgSteps: 0, avgDistance: 0, totalWalks: 0, goalDays: 0 });
      return;
    }

    const totalSteps = data.reduce((sum, d) => sum + d.total_steps, 0);
    const totalDistance = data.reduce((sum, d) => sum + d.total_distance_meters, 0);
    const totalWalks = data.reduce((sum, d) => sum + d.walk_count, 0);
    const goalDays = data.filter(d => d.goal_achieved).length;

    setWeekStats({
      avgSteps: Math.round(totalSteps / data.length),
      avgDistance: Math.round(totalDistance / data.length),
      totalWalks,
      goalDays,
    });
  }

  async function triggerFiSync() {
    try {
      setSyncing(true);
      setSyncStatus(null);

      const response = await fetch('/api/fi/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const fiData = result.data;
        setActivities([{
          id: 'fi-live',
          date: new Date().toISOString().split('T')[0],
          total_steps: fiData.steps,
          total_distance_meters: fiData.distance,
          total_calories: 0,
          walk_count: 0,
          rest_minutes: 0,
          nap_minutes: 0,
          active_minutes: 0,
          play_minutes: 0,
          daily_goal_steps: fiData.dailyGoal,
          goal_achieved: fiData.goalPercent >= 100,
          synced_at: fiData.lastSync,
          created_at: fiData.lastSync,
        } as FiActivity]);
      }

      setSyncStatus({
        success: result.success,
        message: result.success 
          ? `Synced! ${result.data?.steps || 0} steps today (${result.data?.goalPercent || 0}% of goal)` 
          : (result.error || 'Sync failed'),
      });

      if (result.success) {
        // Reload data after successful sync
        await loadActivityData();
      }

    } catch (error: any) {
      setSyncStatus({
        success: false,
        message: error.message || 'Failed to sync with Fi collar',
      });
    } finally {
      setSyncing(false);
    }
  }

  const todayActivity = activities[0];
  const hasData = activities.length > 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-[var(--primary)]" />
            <p className="text-xl text-[var(--text-light)]">Loading activity data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header with Sync Button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[var(--primary)] mb-2">
            📊 Fi Collar Activity
          </h1>
          <p className="text-[var(--text-light)]">
            Real-time activity tracking from Bailey's Fi collar
          </p>
        </div>
        <button
          onClick={triggerFiSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync from Fi'}
        </button>
      </div>

      {/* Sync Status */}
      {syncStatus && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          syncStatus.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {syncStatus.success ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="font-medium">{syncStatus.message}</p>
        </div>
      )}

      {!hasData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center mb-8">
          <Download className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
          <h3 className="text-xl font-bold text-yellow-800 mb-2">No Activity Data Yet</h3>
          <p className="text-yellow-700 mb-4">
            Click "Sync from Fi" to pull activity data from Bailey's Fi collar
          </p>
        </div>
      )}

      {hasData && (
        <>
          {/* Today's Stats */}
          {todayActivity && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-[var(--primary)]">
                Today's Activity ({format(new Date(todayActivity.date), 'MMM d, yyyy')})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox
                  icon={<Footprints className="w-6 h-6" />}
                  label="Steps"
                  value={todayActivity.total_steps.toLocaleString()}
                  color="from-blue-400 to-blue-600"
                  progress={todayActivity.goal_achieved ? 100 : (todayActivity.total_steps / todayActivity.daily_goal_steps) * 100}
                />
                <StatBox
                  icon={<TrendingUp className="w-6 h-6" />}
                  label="Distance"
                  value={`${(todayActivity.total_distance_meters / 1000).toFixed(1)} km`}
                  color="from-green-400 to-green-600"
                />
                <StatBox
                  icon={<Flame className="w-6 h-6" />}
                  label="Calories"
                  value={todayActivity.total_calories.toString()}
                  color="from-orange-400 to-orange-600"
                />
                <StatBox
                  icon={<Activity className="w-6 h-6" />}
                  label="Active Time"
                  value={`${todayActivity.active_minutes} min`}
                  color="from-purple-400 to-purple-600"
                />
              </div>
            </div>
          )}

          {/* Week Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-[var(--primary)]">
                📈 7-Day Average
              </h3>
              <div className="space-y-4">
                <MetricRow 
                  label="Avg Steps" 
                  value={weekStats.avgSteps.toLocaleString()} 
                  icon="👣"
                />
                <MetricRow 
                  label="Avg Distance" 
                  value={`${(weekStats.avgDistance / 1000).toFixed(1)} km`} 
                  icon="📏"
                />
                <MetricRow 
                  label="Total Walks" 
                  value={weekStats.totalWalks.toString()} 
                  icon="🚶"
                />
                <MetricRow 
                  label="Goal Days" 
                  value={`${weekStats.goalDays}/7`} 
                  icon="🎯"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-[var(--primary)]">
                💤 Sleep Summary
              </h3>
              <div className="space-y-3">
                {sleepData.slice(0, 5).map((sleep, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-indigo-500" />
                      <div>
                        <div className="font-medium capitalize">{sleep.sleep_type.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(sleep.date), 'MMM d')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{sleep.duration_minutes} min</div>
                      {sleep.quality_score && (
                        <div className="text-sm text-gray-500">Quality: {sleep.quality_score}/10</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold mb-6 text-[var(--primary)]">
              📊 Daily Steps (Last 7 Days)
            </h3>
            <div className="space-y-3">
              {activities.slice().reverse().map((activity, i) => {
                const percentage = Math.min((activity.total_steps / activity.daily_goal_steps) * 100, 100);
                const isGoalMet = activity.goal_achieved;
                
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">
                        {format(new Date(activity.date), 'EEE, MMM d')}
                      </span>
                      <span className="font-bold text-[var(--primary)]">
                        {activity.total_steps.toLocaleString()} steps
                        {isGoalMet && ' 🎯'}
                      </span>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full flex items-center justify-end px-3 text-white text-sm font-medium rounded-full transition-all ${
                          isGoalMet 
                            ? 'bg-gradient-to-r from-green-400 to-green-600' 
                            : 'bg-gradient-to-r from-blue-400 to-blue-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage >= 20 && `${percentage.toFixed(0)}%`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Walks */}
          {recentWalks.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-[var(--primary)]">
                🚶 Recent Walks (From Fi)
              </h3>
              <div className="space-y-3">
                {recentWalks.map((walk) => (
                  <div key={walk.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1">{walk.location}</div>
                      <div className="text-sm text-gray-600">
                        {walk.start_time && format(new Date(walk.start_time), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div>
                        <div className="text-sm text-gray-500">Duration</div>
                        <div className="font-bold">{walk.duration_minutes} min</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Steps</div>
                        <div className="font-bold">{walk.steps?.toLocaleString() || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Distance</div>
                        <div className="font-bold">
                          {walk.distance_meters ? `${(walk.distance_meters / 1000).toFixed(1)} km` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatBox({ 
  icon, 
  label, 
  value, 
  color, 
  progress 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string; 
  progress?: number;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} text-white rounded-xl p-4 shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90 mb-2">{label}</div>
      {progress !== undefined && (
        <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      <span className="font-bold text-lg text-[var(--primary)]">{value}</span>
    </div>
  );
}
