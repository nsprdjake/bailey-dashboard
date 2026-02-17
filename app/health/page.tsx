"use client";

import { useEffect, useState } from 'react';
import { supabase, VetRecord, Medication, WeightLog } from '../../lib/supabase';
import { Pill, Calendar, AlertCircle, FileText, Plus, DollarSign, Scale, Syringe, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

export default function HealthPage() {
  const [vetRecords, setVetRecords] = useState<VetRecord[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'meds' | 'history'>('overview');

  useEffect(() => {
    async function fetchData() {
      try {
        const [vetRes, medsRes, weightRes] = await Promise.all([
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
            .limit(5)
        ]);

        if (vetRes.data) setVetRecords(vetRes.data);
        if (medsRes.data) setMedications(medsRes.data);
        if (weightRes.data) setWeightLogs(weightRes.data);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
            <p className="text-gray-500 mt-1"> comprehensive view of Bailey's wellness</p>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Current Weight</p>
              <p className="text-2xl font-bold text-gray-900">{latestWeight ? `${latestWeight} lbs` : '--'}</p>
              {weightTrend && (
                <p className={`text-xs font-medium ${Number(weightTrend) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(weightTrend) > 0 ? '+' : ''}{weightTrend} lbs since last check
                </p>
              )}
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

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-pink-50 rounded-lg text-pink-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Next Visit</p>
              <p className="text-lg font-bold text-gray-900 truncate">
                {vetRecords.find(r => r.next_due_date && new Date(r.next_due_date) > new Date())?.next_due_date 
                  ? formatDate(vetRecords.find(r => r.next_due_date && new Date(r.next_due_date) > new Date())!.next_due_date!)
                  : 'None scheduled'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('meds')}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'meds' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Medications
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Vet History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
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
