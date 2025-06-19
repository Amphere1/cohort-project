'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AddPatientPage() {
  const [form, setForm] = useState({
    name: '',
    age: '',
    symptoms: '',
    preferredDoctor: '',
    appointmentReason: '',
    gender: '',
    contactNumber: '',
    address: '',
    medicalHistory: '',
    allergies: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patientData, setPatientData] = useState<any>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPatientData(null);
    setAppointmentData(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          age: Number(form.age),
          symptoms: form.symptoms.split(',').map(s => s.trim()),
          preferredDoctor: form.preferredDoctor,
          appointmentReason: form.appointmentReason,
          gender: form.gender,
          contactNumber: form.contactNumber,
          address: form.address,
          medicalHistory: form.medicalHistory.split(',').map(m => m.trim()),
          allergies: form.allergies.split(',').map(a => a.trim()),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Patient record created and appointment scheduled successfully');
        setPatientData(data.data.patient);
        setAppointmentData(data.data.appointment);
        setForm({
          name: '',
          age: '',
          symptoms: '',
          preferredDoctor: '',
          appointmentReason: '',
          gender: '',
          contactNumber: '',
          address: '',
          medicalHistory: '',
          allergies: '',
        });
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <main>
    <div className="flex min-h-screen items-center justify-center bg-primary-light">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Add Patient & Schedule Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" type="text" placeholder="Patient Name" value={form.name} onChange={handleChange} required />
            <Input name="age" type="number" placeholder="Age" value={form.age} onChange={handleChange} required />
            <Input name="symptoms" type="text" placeholder="Symptoms (comma separated)" value={form.symptoms} onChange={handleChange} required />
            <Input name="preferredDoctor" type="text" placeholder="Preferred Doctor" value={form.preferredDoctor} onChange={handleChange} />
            <Input name="appointmentReason" type="text" placeholder="Appointment Reason" value={form.appointmentReason} onChange={handleChange} required />
            <Input name="gender" type="text" placeholder="Gender" value={form.gender} onChange={handleChange} required />
            <Input name="contactNumber" type="text" placeholder="Contact Number" value={form.contactNumber} onChange={handleChange} required />
            <Input name="address" type="text" placeholder="Address" value={form.address} onChange={handleChange} required />
            <Input name="medicalHistory" type="text" placeholder="Medical History (comma separated)" value={form.medicalHistory} onChange={handleChange} />
            <Input name="allergies" type="text" placeholder="Allergies (comma separated)" value={form.allergies} onChange={handleChange} />
            {error && <div className="text-red-500">{error}</div>}
            {success && <div className="text-green-600">{success}</div>}
            <Button type="submit" className="w-full bg-primary text-white">
              Add Patient & Schedule
            </Button>
          </form>
          {patientData && (
            <div className="mt-6 p-4 border rounded bg-green-50">
              <h3 className="font-bold mb-2">Patient Record</h3>
              <pre className="text-xs">{JSON.stringify(patientData, null, 2)}</pre>
            </div>
          )}
          {appointmentData && (
            <div className="mt-4 p-4 border rounded bg-blue-50">
              <h3 className="font-bold mb-2">Appointment Details</h3>
              <pre className="text-xs">{JSON.stringify(appointmentData, null, 2)}</pre>
            </div>
          )}
          </CardContent>
      </Card>
    </div>
    </main>
  );
}