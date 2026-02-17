"use client";

import { useEffect, useState } from 'react';
import { supabase, VetRecord, Medication, WeightLog } from '../../lib/supabase';
import { Pill, Calendar, AlertCircle, FileText, Plus, DollarSign, Scale, Syringe, Stethoscope, Activity, Moon, MapPin, Battery, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface FiActivity {
  id: string;
  date: string;
  steps: number;
  distance_miles: number;
  calories: number;
  active_minutes: number;
  rest_minutes: number;
}

interface FiSleep {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  type: 'nap' | 'sleep';
  quality?: number;
}

export default function HealthPage() {
  const [vetRecords, setVetRecords] = useState<VetRecord[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [fiActivity, setFiActivity] = useState<FiActivity[]>([]);
  const [fiSleep, setFiSleep] = useState<FiSleep[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'meds' | 'history' | 'activity'>('overview');

  useEffect(() => {
    async function fetchData() {
      try {
        const [vetRes, medsRes, weightRes, activityRes, sleepRes] = await Promise.all([
          supabase
            .from('bailey_vet_records')
            .select('*')
            .order('date', { ascending: false }),
          supabase
            .from('bailey_medications')
            .select('*')
            .eq('active', true)
            .order('start_date', { ascending: false }),
          supabase
            .from('bailey_weight_logs')
            .select('*')
            .order('date', { ascending: false })
            .limit(5),
          supabase
            .from('bailey_fi_activity')
            .select('*')
            .order('date', { ascending: false })
            .limit(7),
          supabase
            .from('bailey_fi_sleep')
            .select('*')
            .order('date', { ascending: false })
            .limit(7)
        ]);

        if (vetRes.data) setVetRecords(vetRes.data);
        if (medsRes.data) setMedications(medsRes.data);
        if (weightRes.data) setWeightLogs(weightRes.data);
        if (activityRes.data) setFiActivity(activityRes.data);
        if (sleepRes.data) setFiSleep(sleepRes.data);
      } catch (error) {
        console.error('Error fetching health data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'vaccine': return <Syringe className="w-5 h-5 text-blue-500" />;
      case 'medication': return <Pill className="w-5 h-5 text-purple-500" />;
      case 'visit': return <Stethoscope className="w-5 h-5 text-pink-500" />;
      case 'surgery': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const latestWeight = weightLogs.length > 0 ? weightLogs[0].weight_lbs : null;
  const weightTrend = weightLogs.length >= 2 
    ? (weightLogs[0].weight_lbs - weightLogs[1].weight_lbs).toFixed(1)
    : null;

  const todayActivity = fiActivity.length > 0 ? fiActivity[0] : null;
  const todaySleep = fiSleep.filter(s => s.date === new Date().toISOString().split('T')[0])
    .reduce((total, sleep) => total + sleep.duration_minutes, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
            <p className="text-gray-500 mt-1">Comprehensive view of Bailey's wellness</p>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Weight</p>
              <p className="text-2xl font-bold text-gray-900">{latestWeight ? `${latestWeight} lbs` : '--'}</p>
              {weightTrend && (
                <p className={`text-xs font-medium ${Number(weightTrend) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(weightTrend) > 0 ? '+' : ''}{weightTrend} lbs
                </p>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Today's Steps</p>
              <p className="text-2xl font-bold text-gray-900">{todayActivity ? todayActivity.steps.toLocaleString() : '--'}</p>
              <p className="text-xs text-gray-400">{todayActivity ? `${todayActivity.distance_miles.toFixed(1)} miles` : 'No data'}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Rest Today</p>
              <p className="text-2xl font-bold text-gray-900">{todaySleep > 0 ? `${Math.round(todaySleep / 60)}h` : '--'}</p>
              <p className="text-xs text-gray-400">{todaySleep > 0 ? `${todaySleep} minutes` : 'No data'}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Meds</p>
              <p className="text-2xl font-bold text-gray-900">{medications.length}</p>
              <p className="text-xs text-gray-400">Daily treatments</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-1 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'activity' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Activity & Sleep
          </button>
          <button 
            onClick={() => setActiveTab('meds')}
            className={`pb-3 px-1 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'meds' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Medications
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Vet History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Fi Collar Status */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Fi Collar Status</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <Battery className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Battery</p>
                      <p className="font-semibold text-gray-900">87%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold text-gray-900">Home</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-500">Activity</p>
                      <p className="font-semibold text-gray-900">Resting</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                <button onClick={() => setActiveTab('history')} className="text-indigo-600 text-sm hover:underline">View All</button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                  <div className="p-4 animate-pulse space-y-3">
                    <div className="h-6 bg-gray-100 w-3/4 rounded"></div>
                    <div className="h-6 bg-gray-100 w-1/2 rounded"></div>
                  </div>
                ) : vetRecords.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {vetRecords.slice(0, 3).map(record => (
                      <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          {getRecordIcon(record.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{record.title}</h3>
                          <p className="text-sm text-gray-500">{formatDate(record.date)} • {record.vet_name || 'Unknown'}</p>
                        </div>
                        {record.cost && (
                          <span className="text-sm font-medium text-gray-600">${record.cost}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">No recent records.</div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Weekly Activity Chart */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Weekly Activity</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="space-y-4">
                  {fiActivity.slice(0, 7).map((day, index) => (
                    <div key={day.id} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((day.steps / 13500) * 100, 100)}%` }}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700">
                          {day.steps.toLocaleString()} steps
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 w-16 text-right">
                        {day.distance_miles.toFixed(1)} mi
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Sleep Patterns */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Sleep Patterns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fiSleep.slice(0, 6).map((sleep) => (
                  <div key={sleep.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sleep.type === 'sleep' ? '😴 Night Sleep' : '💤 Nap'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(sleep.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-indigo-600">
                        {Math.round(sleep.duration_minutes / 60)}h {sleep.duration_minutes % 60}m
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(sleep.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(sleep.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'meds' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map(med => (
              <div key={med.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{med.name}</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Active</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mt-3">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="font-medium">Dosage</span>
                    <span>{med.dosage}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="font-medium">Frequency</span>
                    <span>{med.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Started</span>
                    <span>{formatDate(med.start_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {vetRecords.map(record => (
              <div key={record.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {getRecordIcon(record.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">{record.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(record.date)} • {record.vet_name || 'Unknown Clinic'}</p>
                      </div>
                      {record.cost && (
                        <span className="text-sm font-medium text-gray-600 flex items-center">
                          <DollarSign className="w-3 h-3" />
                          {record.cost}
                        </span>
                      )}
                    </div>
                    
                    {record.description && (
                      <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                        {record.description}
                      </p>
                    )}

                    {record.next_due_date && (
                      <div className="mt-3 inline-flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Due: {formatDate(record.next_due_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}