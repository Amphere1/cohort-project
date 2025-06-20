'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loginUser } from '@/lib/api';
import { Stethoscope, ArrowLeft } from 'lucide-react';

export default function DoctorLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    govtRegistrationNumber: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');    try {      console.log('Doctor login: Attempting login with credentials:', formData);
      console.log('Using backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
      const response = await loginUser(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/doctor-login`, formData);
      console.log('Doctor login: Login successful, response:', response);
      console.log('Doctor login: User data stored:', response.user);
      console.log('Doctor login: User role:', response.user.role);
      
      // Verify localStorage was set correctly
      console.log('Doctor login: Token in localStorage:', localStorage.getItem('token'));
      console.log('Doctor login: User in localStorage:', localStorage.getItem('user'));
      
      router.push('/doctor/dashboard');} catch (err: unknown) {
      setError((err as Error).message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Doctor Login
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Access your medical dashboard
            </p>
          </CardHeader>
          <CardContent>            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
                {/* Sample Doctor Credentials Information */}
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                <div className="font-medium mb-1">How to Login as Doctor:</div>
                <div className="text-xs space-y-2">
                  <div>
                    <strong>1. Get Registration Number:</strong> You can get govt registration number of the assigned doctor in the doctor section of reception dashboard
                  </div>
                  <div>
                    <strong>2. Default Password:</strong> doctor123
                  </div>
                  <div className="text-blue-600 font-medium">
                    Sample Registration: NMC-2021-54077, DMC-2017-64253, SMC-2018-40127
                  </div>
                </div>                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open('/reception', '_blank')}
                  >
                    Open Reception Dashboard
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setFormData({
                      govtRegistrationNumber: 'NMC-2021-54077',
                      password: 'doctor123'
                    })}
                  >
                    Use Sample Registration
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="govtRegistrationNumber">Government Registration Number</Label>
                <Input
                  id="govtRegistrationNumber"
                  name="govtRegistrationNumber"
                  type="text"
                  placeholder="Enter your registration number"
                  value={formData.govtRegistrationNumber}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need access? Contact your hospital administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
