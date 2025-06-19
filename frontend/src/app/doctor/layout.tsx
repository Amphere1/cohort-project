import { ReactNode } from 'react';
import Link from 'next/link';

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-primary-light">
      <aside className="w-64 bg-white shadow-lg p-4">
        <div className="font-bold text-primary mb-6 text-xl">HealthClinic</div>
        <nav className="space-y-2">
          <Link href="/doctor/dashboard" className="block px-3 py-2 rounded hover:bg-primary-light text-primary-dark">Dashboard</Link>
          <Link href="/doctor/appointments" className="block px-3 py-2 rounded hover:bg-primary-light text-primary-dark">Appointments</Link>
          <Link href="/doctor/patients" className="block px-3 py-2 rounded hover:bg-primary-light text-primary-dark">Patients</Link>
          <Link href="/doctor/prescriptions" className="block px-3 py-2 rounded hover:bg-primary-light text-primary-dark">Prescriptions</Link>
          <Link href="/doctor/preferences" className="block px-3 py-2 rounded hover:bg-primary-light text-primary-dark">Preferences</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
