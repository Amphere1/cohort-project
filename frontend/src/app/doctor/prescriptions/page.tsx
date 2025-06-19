'use client';

import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Patient = {
  _id: string;
  name: string;
};

type Prescription = {
  _id: string;
  patientName: string;
  date: string;
  content: string;
};

export default function DoctorPrescriptionsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [symptoms, setSymptoms] = useState('');
  const [aiPrescription, setAiPrescription] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
   const [interactionResult, setInteractionResult] = useState<string | null>(null);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const interactionChecked = useRef(false);


  // Fetch patients for dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    };
    fetchPatients();
  }, []);

  // Fetch prescription history for selected patient
  useEffect(() => {
    if (!selectedPatient) return;
    const fetchPrescriptions = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/doctor/prescriptions?patientId=${selectedPatient}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions || []);
      }
    };
    fetchPrescriptions();
  }, [selectedPatient]);

  // Generate AI prescription
  const handleGenerate = async () => {
    setLoading(true);
    setAiPrescription('');
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescriptions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        patientId: selectedPatient,
        symptoms,
      }),
    });
    const data = await res.json();
    setAiPrescription(data.prescription || '');
    setLoading(false);
  };
    // Drug interaction checker
  const handleCheckInteractions = async () => {
    setCheckingInteractions(true);
    setInteractionResult(null);
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescriptions/check-interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        patientId: selectedPatient,
        prescription: aiPrescription,
      }),
    });
    const data = await res.json();
    setInteractionResult(data.result || 'No interaction data.');
    setCheckingInteractions(false);
    interactionChecked.current = true;
  };


  // Save prescription
  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescriptions/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        patientId: selectedPatient,
        content: aiPrescription,
      }),
    });
    if (res.ok) {
      // Refresh prescription history
      const data = await res.json();
      setPrescriptions([data.prescription, ...prescriptions]);
      setAiPrescription('');
      setSymptoms('');
    }
    setSaving(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">AI Prescriptions</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate AI Prescription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Select Patient</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedPatient}
              onChange={e => setSelectedPatient(e.target.value)}
            >
              <option value="">-- Select --</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Symptoms / Notes</label>
            <Textarea
              placeholder="Describe symptoms, allergies, etc."
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            className="bg-primary text-white"
            onClick={handleGenerate}
            disabled={!selectedPatient || !symptoms || loading}
          >
            {loading ? 'Generating...' : 'Generate Prescription'}
          </Button>
        </CardContent>
      </Card>

      {aiPrescription && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit & Save Prescription</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={aiPrescription}
              onChange={e => {
                setAiPrescription(e.target.value)
                interactionChecked.current = false;
                setInteractionResult(null);}
              }
              rows={6}
            />
            <div className="flex gap-2 mt-4">
              <Button
                className="bg-blue-500 text-white"
                type="button"
                onClick={handleCheckInteractions}
                disabled={checkingInteractions || !aiPrescription}
              >
                {checkingInteractions ? 'Checking...' : 'Check Drug Interactions'}
              </Button>
              <Button
                className="bg-primary text-white"
                onClick={handleSave}
                disabled={saving || !interactionChecked.current}
                title={!interactionChecked.current ? 'Check interactions before saving' : ''}
              >
                {saving ? 'Saving...' : 'Save Prescription'}
              </Button>
            </div>
            {interactionResult && (
              <div className={`mt-4 p-3 rounded ${interactionResult.includes('No interactions') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {interactionResult}
              </div>
            )}
            {!interactionChecked.current && (
              <div className="mt-2 text-sm text-yellow-700">Please check for drug interactions before saving.</div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Prescription History</CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div>No prescriptions found for this patient.</div>
          ) : (
            <ul className="space-y-4">
              {prescriptions.map((presc) => (
                <li key={presc._id} className="border-b pb-2">
                  <div className="font-semibold">{presc.date}</div>
                  <div>{presc.content}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
