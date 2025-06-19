'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DoctorDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Doctor Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/doctor/appointments">
          <Card className="hover:shadow-lg transition cursor-pointer">
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <p>View and manage your upcoming and past appointments.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/doctor/patients">
          <Card className="hover:shadow-lg transition cursor-pointer">
            <CardHeader>
              <CardTitle>Patients & Medical History</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Access patient details and their medical history.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/doctor/prescriptions">
          <Card className="hover:shadow-lg transition cursor-pointer">
            <CardHeader>
              <CardTitle>AI Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Generate, edit, and save AI-powered prescriptions.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/doctor/preferences">
          <Card className="hover:shadow-lg transition cursor-pointer">
            <CardHeader>
              <CardTitle>Prescription Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Review and update your prescription preferences.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
