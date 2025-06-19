'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Preference = {
  medication: string;
  count: number;
};

export default function DoctorPreferencesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences || []);
      }
      setLoading(false);
    };
    fetchPreferences();
  }, []);

  const handleEdit = (idx: number, current: string) => {
    setEditing(idx);
    setEditValue(current);
  };

  const handleSave = async (idx: number) => {
    const token = localStorage.getItem('token');
    const oldMedication = preferences[idx].medication;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescriptions/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        oldMedication,
        newMedication: editValue,
      }),
    });
    if (res.ok) {
      const updated = [...preferences];
      updated[idx].medication = editValue;
      setPreferences(updated);
      setEditing(null);
    }
  };

  const filtered = preferences.filter((pref) =>
    pref.medication.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Prescription Preferences</h1>
      <Card>
        <CardHeader>
          <CardTitle>Most Frequently Prescribed Medications</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Filter medications"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="mb-4 max-w-xs"
          />
          {loading ? (
            <div>Loading...</div>
          ) : filtered.length === 0 ? (
            <div>No preference data found.</div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((pref, idx) => (
                <li key={idx} className="flex items-center justify-between border-b pb-2">
                  {editing === idx ? (
                    <>
                      <Input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="max-w-xs"
                      />
                      <Button size="sm" className="ml-2" onClick={() => handleSave(idx)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" className="ml-2" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span>{pref.medication}</span>
                      <span className="text-sm text-gray-500">Prescribed {pref.count} times</span>
                      <Button size="sm" variant="outline" className="ml-2" onClick={() => handleEdit(idx, pref.medication)}>
                        Edit
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
