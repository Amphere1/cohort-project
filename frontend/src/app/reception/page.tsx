'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

type Appointment = {
  _id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  status: string;
};

type Doctor = {
  _id: string;
  name: string;
};

type Patient = {
  _id: string;
  name: string;
};

export default function ReceptionAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    doctorId: '',
    date: '',
    time: '',
    status: '',
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchPatients();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reception/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setAppointments(data.appointments || []);
    }
    setLoading(false);
  };

  const fetchDoctors = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reception/doctors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setDoctors(data.doctors || []);
    }
  };

  const fetchPatients = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reception/patients`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPatients(data.patients || []);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reception/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ patientId: '', doctorId: '', date: '', time: '' });
      setShowAdd(false);
      fetchAppointments();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reception/appointments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchAppointments();
  };

  const handleEdit = (appt: Appointment) => {
    setEditingId(appt._id);
    setEditForm({
      doctorId: doctors.find(d => d.name === appt.doctorName)?._id || '',
      date: appt.date,
      time: appt.time,
      status: appt.status,
    });
  };

  const handleEditSave = async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reception/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditingId(null);
      fetchAppointments();
    }
  };

  const filtered = appointments.filter(
    a =>
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Manage Appointments</h1>
      <div className="mb-4 flex items-center gap-4">
        <Input
          placeholder="Search by patient or doctor"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button className="bg-primary text-white" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ New Appointment'}
        </Button>
      </div>
      {showAdd && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddAppointment}>
              <select
                className="border rounded px-3 py-2"
                value={form.patientId}
                onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
                required
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <select
                className="border rounded px-3 py-2"
                value={form.doctorId}
                onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
              <Input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                required
              />
              <Button className="bg-primary text-white col-span-2" type="submit">
                Add Appointment
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Appointment List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : filtered.length === 0 ? (
            <div>No appointments found.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a._id} className="border-b">
                    {editingId === a._id ? (
                      <>
                        <td>{a.patientName}</td>
                        <td>
                          <select
                            className="border rounded px-2 py-1"
                            value={editForm.doctorId}
                            onChange={e => setEditForm(f => ({ ...f, doctorId: e.target.value }))}
                          >
                            <option value="">Select Doctor</option>
                            {doctors.map(d => (
                              <option key={d._id} value={d._id}>{d.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <Input
                            type="date"
                            value={editForm.date}
                            onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                          />
                        </td>
                        <td>
                          <Input
                            type="time"
                            value={editForm.time}
                            onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                          />
                        </td>
                        <td>
                          <select
                            className="border rounded px-2 py-1"
                            value={editForm.status}
                            onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <Button size="sm" className="mr-2" onClick={() => handleEditSave(a._id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{a.patientName}</td>
                        <td>{a.doctorName}</td>
                        <td>{a.date}</td>
                        <td>{a.time}</td>
                        <td>{a.status}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mr-2"
                            onClick={() => handleEdit(a)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(a._id)}
                          >
                            Cancel
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}