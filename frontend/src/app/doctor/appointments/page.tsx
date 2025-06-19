'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Appointment = {
  _id: string;
  patientName: string;
  date: string;
  time: string;
  status: string;
  reason: string;
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
      setLoading(false);
    };
    fetchAppointments();
  }, []);

  return (
    <main>
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">My Appointments</h1>
      {loading ? (
        <div>Loading...</div>
      ) : appointments.length === 0 ? (
        <div>No appointments found.</div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appt) => (
            <Card key={appt._id}>
              <CardHeader>
                <CardTitle>
                  {appt.patientName} — {appt.date} at {appt.time}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>Status: {appt.status}</div>
                <div>Reason: {appt.reason}</div>
                {/* Add buttons for actions if needed */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </main>
  );
}
