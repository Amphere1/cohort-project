'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    doctorId: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.doctorId) params.append('doctorId', filters.doctorId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patient/appointments?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setAppointments(data.data);
      } else {
        setError(data.message || 'Failed to fetch appointments');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAppointments();
  };

  return (
    <main>
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Appointments</h2>
      <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-2 mb-4">
        <select name="status" value={filters.status} onChange={handleFilterChange} className="border rounded p-2">
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
        <Input name="doctorId" type="text" placeholder="Doctor ID" value={filters.doctorId} onChange={handleFilterChange} />
        <Input name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} />
        <Input name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} />
        <Button type="submit" className="bg-primary text-white">Filter</Button>
      </form>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border p-2">Patient</th>
              <th className="border p-2">Doctor</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a._id}>
                <td className="border p-2">{a.name}</td>
                <td className="border p-2">{a.assignedDoctorId?.name || '-'}</td>
                <td className="border p-2">{a.appointmentStatus}</td>
                <td className="border p-2">{a.appointmentDate ? new Date(a.appointmentDate).toLocaleString() : '-'}</td>
                <td className="border p-2">
                  <UpdateStatusButton patientId={a._id} currentStatus={a.appointmentStatus} />
                  <ToggleCompleteButton patientId={a._id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </main>
  );
}

// Update Appointment Status Button
function UpdateStatusButton({ patientId, currentStatus }: { patientId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const handleUpdate = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patient/${patientId}/appointment`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ appointmentStatus: status }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg('Status updated');
      } else {
        setMsg(data.message || 'Failed');
      }
    } catch {
      setMsg('Network error');
    }
    setLoading(false);
  };

  return (
    <main>
    <span>
      <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded p-1 mr-1">
        <option value="scheduled">Scheduled</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
        <option value="rescheduled">Rescheduled</option>
      </select>
      <Button type="button" onClick={handleUpdate} disabled={loading} className="bg-blue-500 text-white px-2 py-1">
        Update
      </Button>
      {msg && <span className="ml-2 text-xs">{msg}</span>}
    </span>
    </main>
  );
}

// Toggle Appointment Completion Button
function ToggleCompleteButton({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const handleToggle = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patient/${patientId}/complete`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg('Marked as completed');
      } else {
        setMsg(data.message || 'Failed');
      }
    } catch {
      setMsg('Network error');
    }
    setLoading(false);
  };

  return (
    <Button type="button" onClick={handleToggle} disabled={loading} className="bg-green-500 text-white px-2 py-1 ml-2">
      Complete
    </Button>
  );
}