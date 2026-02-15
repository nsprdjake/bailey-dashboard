'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { supabase, type HealthRecord } from '@/lib/supabase';
import { Plus, Heart, Syringe, Pill, Scale } from 'lucide-react';
import { format } from 'date-fns';

const RECORD_TYPES = [
  { value: 'vet_visit', label: 'Vet Visit', icon: Heart, color: 'bg-pink-500' },
  { value: 'vaccination', label: 'Vaccination', icon: Syringe, color: 'bg-blue-500' },
  { value: 'medication', label: 'Medication', icon: Pill, color: 'bg-purple-500' },
  { value: 'weight', label: 'Weight Check', icon: Scale, color: 'bg-green-500' },
];

type RecordType = 'vet_visit' | 'vaccination' | 'medication' | 'weight';

export default function HealthPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{
    type: RecordType;
    date: string;
    title: string;
    description: string;
    value: string;
  }>({
    type: 'vet_visit',
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    value: '',
  });

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    const { data } = await supabase
      .from('bailey_health')
      .select('*')
      .order('date', { ascending: false });
    setRecords(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('bailey_health').insert([formData]);
    setFormData({
      type: 'vet_visit',
      date: new Date().toISOString().split('T')[0],
      title: '',
      description: '',
      value: '',
    });
    setShowForm(false);
    loadRecords();
  }

  const upcomingRecords = records.filter(
    (r) => new Date(r.date) > new Date()
  );
  const pastRecords = records.filter(
    (r) => new Date(r.date) <= new Date()
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-[var(--primary)]">💊 Health Records</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[var(--primary)] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Record
        </button>
      </div>

      {/* Add Record Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-bounce-in">
          <h2 className="text-2xl font-bold mb-4 text-[var(--primary)]">New Health Record</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as RecordType })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
              >
                {RECORD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                required
                placeholder="e.g., Annual Checkup, Rabies Vaccine"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                rows={3}
                placeholder="Additional details"
              />
            </div>
            {formData.type === 'weight' && (
              <div>
                <label className="block text-sm font-medium mb-2">Weight</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                  placeholder="e.g., 52 lbs"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-[var(--primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
              >
                Save Record
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming */}
      {upcomingRecords.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--primary)] mb-4">📅 Upcoming</h2>
          <div className="space-y-3">
            {upcomingRecords.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--primary)] mb-4">📋 History</h2>
        <div className="space-y-3">
          {pastRecords.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RecordCard({ record }: { record: HealthRecord }) {
  const typeInfo = RECORD_TYPES.find((t) => t.value === record.type);
  const Icon = typeInfo?.icon || Heart;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${typeInfo?.color} rounded-full flex items-center justify-center text-white`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg">{record.title}</h3>
              <p className="text-sm text-[var(--text-light)]">
                {format(new Date(record.date), 'MMMM d, yyyy')}
              </p>
            </div>
            {record.value && (
              <div className="bg-[var(--accent)] px-3 py-1 rounded-full text-sm font-medium">
                {record.value}
              </div>
            )}
          </div>
          {record.description && (
            <p className="text-[var(--text-light)] mt-2">{record.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
