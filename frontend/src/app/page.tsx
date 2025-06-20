'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Shield, UserCheck, Heart } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const roles = [
    {
      title: 'Doctor',
      description: 'Access patient records, appointments, and prescription management',
      icon: Stethoscope,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/login/doctor'
    },
    {
      title: 'Admin',
      description: 'Manage doctors, system settings, and administrative tasks',
      icon: Shield,
      color: 'bg-red-600 hover:bg-red-700',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      path: '/login/admin'
    },
    {
      title: 'Reception',
      description: 'Schedule appointments, manage patient check-ins and records',
      icon: UserCheck,
      color: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      path: '/login/reception'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">HealthCare Pro</h1>
                <p className="text-gray-600 text-sm">Comprehensive Medical Management System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to Your Healthcare Portal
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your role to access the appropriate dashboard and tools for efficient healthcare management.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card key={role.title} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center">
                  <div className={`mx-auto mb-4 p-4 rounded-full w-fit ${role.bgColor}`}>
                    <IconComponent className={`h-12 w-12 ${role.textColor}`} />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {role.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    {role.description}
                  </p>
                  <Button
                    onClick={() => router.push(role.path)}
                    className={`w-full ${role.color} text-white`}
                  >
                    Login as {role.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-8">System Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-2">Real-time Updates</h4>
              <p className="text-gray-600 text-sm">Live notifications and updates across all dashboards</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-2">AI-Powered Prescriptions</h4>
              <p className="text-gray-600 text-sm">Intelligent prescription recommendations and drug interaction checks</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-2">Comprehensive Management</h4>
              <p className="text-gray-600 text-sm">Complete patient, appointment, and medical record management</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-2">Role-based Access</h4>
              <p className="text-gray-600 text-sm">Secure, role-specific access controls and permissions</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-2">Modern Interface</h4>
              <p className="text-gray-600 text-sm">Intuitive, responsive design for all devices</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-2">Secure & Reliable</h4>
              <p className="text-gray-600 text-sm">HIPAA-compliant security and data protection</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-2 bg-blue-600 rounded-lg mr-3">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold">HealthCare Pro</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Empowering healthcare professionals with modern technology
          </p>
          <p className="text-gray-500 text-sm">
            © 2025 HealthCare Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
