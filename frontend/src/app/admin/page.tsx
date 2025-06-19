'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAddDoctorPage() {
  const [form, setForm] = useState({
    name: '',
    govtRegistrationNumber: '',
    specialization: '',
    experience: '',
    contactNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    qualifications: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleQualificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, qualifications: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/add-doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          experience: Number(form.experience),
          qualifications: form.qualifications.split(',').map(q => q.trim()),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Added/Edited successfully');
        setForm({
          name: '',
          govtRegistrationNumber: '',
          specialization: '',
          experience: '',
          contactNumber: '',
          email: '',
          password: '',
          confirmPassword: '',
          qualifications: '',
        });
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-light">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Add/Edit Doctor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="name"
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <Input
              name="govtRegistrationNumber"
              type="text"
              placeholder="Govt Registration Number"
              value={form.govtRegistrationNumber}
              onChange={handleChange}
              required
            />
            <Input
              name="specialization"
              type="text"
              placeholder="Specialization"
              value={form.specialization}
              onChange={handleChange}
              required
            />
            <Input
              name="experience"
              type="number"
              placeholder="Experience (years)"
              value={form.experience}
              onChange={handleChange}
              required
            />
            <Input
              name="contactNumber"
              type="text"
              placeholder="Contact Number"
              value={form.contactNumber}
              onChange={handleChange}
              required
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            <Input
              name="qualifications"
              type="text"
              placeholder="Qualifications (comma separated, e.g. MBBS, MD, DM)"
              value={form.qualifications}
              onChange={handleQualificationsChange}
              required
            />
            {error && <div className="text-red-500">{error}</div>}
            {success && <div className="text-green-600">{success}</div>}
            <Button type="submit" className="w-full bg-primary text-white">
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}