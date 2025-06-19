'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReceptionistLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'receptionist',
          email,
          password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        // Save token and user info to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/receptionist/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <main>
    <div className="flex min-h-screen items-center justify-center bg-primary-light">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">Receptionist Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <div className="text-red-500">{error}</div>}
            <Button type="submit" className="w-full bg-primary text-white">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </main>
  );
}