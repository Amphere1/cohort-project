'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest, getCurrentUser, logout, User } from '@/lib/api';
import { Calendar, Clock, User as UserIcon, FileText, LogOut, Bell } from 'lucide-react';

type Appointment = {
  _id: string;
  name: string; // Changed from patientName to name (matches API response)
  patientId: string;
  age: number;
  symptoms: string[];
  assignedDoctorId: string;
  assignedDoctorName: string;
  appointmentStatus: string;
  appointmentDate: string;
  caseSummary?: {
    summary: string;
    possibleConditions: string[];
    recommendedTests: string[];
    suggestedQuestions: string[];
  };
};

type Prescription = {
  _id: string;
  patientName: string; // Keep this as patientName since prescriptions API might be different
  patientId: string;
  diagnosis: string;
  createdAt: string;
};

export default function DoctorDashboard() {
  const router = useRouter();
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null); // Start as null to prevent hydration mismatch
  const [doctor, setDoctor] = useState<User | null>(null);
  const [totalAppointments, setTotalAppointments] = useState(0); // For debugging
  
  // Fetch appointments and recent prescriptions
  const fetchDashboardData = useCallback(async () => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'doctor') {
      console.log('Dashboard: No valid doctor user found during data fetch');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Dashboard: Current doctor user:', currentUser);
      console.log('Dashboard: Making API request to /api/doctor/appointments');
      
      // Fetch all appointments
      const appointmentsData = await apiRequest<{appointments: Appointment[]}>('/api/doctor/appointments');
      
      console.log('Dashboard: Raw appointments data:', appointmentsData);
      
      // Sort all appointments by date/time
      const sortedAppointments = (appointmentsData.appointments || [])
        .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
      
      console.log('Dashboard: Total appointments fetched:', sortedAppointments.length);
      setTotalAppointments(sortedAppointments.length);
      console.log('Dashboard: All appointments:', sortedAppointments.map(a => ({
        id: a._id,
        name: a.name,
        date: a.appointmentDate,
        status: a.appointmentStatus
      })));
      
      // TEMPORARY: Show all appointments for debugging
      console.log('Dashboard: Showing ALL appointments for debugging');
      const todaysAppts = sortedAppointments;
      
      console.log('Dashboard: Found today\'s appointments:', todaysAppts.length);
      console.log('Dashboard: Today\'s appointments data:', todaysAppts);
      setTodaysAppointments(todaysAppts);
      
      // Fetch recent prescriptions
      const prescriptionsData = await apiRequest<{prescriptions: Prescription[]}>('/api/prescriptions/doctor-prescriptions?limit=5');
      setRecentPrescriptions(prescriptionsData.prescriptions || []);
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLoading(false);
    }
  }, []);

  // Fetch doctor data on component mount
  useEffect(() => {
    const user = getCurrentUser();
    console.log('Dashboard: Current user from localStorage:', user);
    console.log('Dashboard: Token from localStorage:', localStorage.getItem('token'));
    console.log('Dashboard: Raw user string from localStorage:', localStorage.getItem('user'));
    
    if (!user) {
      console.log('Dashboard: No user found, redirecting to login');
      router.push('/login/doctor');
      return;
    }
    
    if (user.role !== 'doctor') {
      console.log('Dashboard: User role is not doctor, role:', user.role, 'redirecting to login');
      router.push('/login/doctor');
      return;
    }      console.log('Dashboard: User authenticated as doctor, setting user data');
    setDoctor(user);
    
    // Initialize time on client side to prevent hydration mismatch
    setCurrentTime(new Date());
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timeInterval);
  }, [router]);
  
  // Fetch data when doctor is set
  useEffect(() => {
    if (doctor) {
      fetchDashboardData();
    }  }, [doctor, fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up polling for real-time updates
    const pollInterval = setInterval(fetchDashboardData, 30000); // Poll every 30 seconds
    
    // Refresh data when window gains focus (user returns from another page)
    const handleFocus = () => {
      fetchDashboardData();
    };
    
    // Refresh data when page becomes visible (user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchDashboardData]);
  
  // Format appointment time
  const formatAppointmentTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle appointment click
  const handleAppointmentClick = (appointmentId: string) => {
    router.push(`/doctor/appointments/${appointmentId}`);
  };
  
  // Handle prescription click
  const handlePrescriptionClick = (prescriptionId: string) => {
    router.push(`/doctor/prescriptions/${prescriptionId}`);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login/doctor');
  };

  return (
    <div className="container mx-auto px-4 py-6">      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>          <p className="text-gray-500 mt-1">
            Welcome back, {doctor?.name || 'Doctor'}{currentTime ? ` | ${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDashboardData} className="gap-2" disabled={loading}>
            <Bell className="h-4 w-4" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Navigate to key areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="justify-start" onClick={() => router.push('/doctor/appointments')}>
                <Calendar className="h-4 w-4 mr-2" />
                All Appointments
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => router.push('/doctor/prescriptions')}>
                <FileText className="h-4 w-4 mr-2" />
                All Prescriptions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's summary */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Summary</CardTitle>
            <CardDescription>At a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  Appointments Today
                </span>
                <span className="font-semibold">{todaysAppointments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-green-500" />
                  Next Appointment
                </span>
                <span className="font-semibold">
                  {todaysAppointments[0] ? formatAppointmentTime(todaysAppointments[0].appointmentDate) : 'None'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Recent updates</CardDescription>
          </CardHeader>
          <CardContent>            {todaysAppointments.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Bell className="h-4 w-4 text-amber-500" />
                  <span>You have {todaysAppointments.length} appointment{todaysAppointments.length !== 1 ? 's' : ''} scheduled for today</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No new notifications</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList>
          <TabsTrigger value="appointments">Today&apos;s Appointments</TabsTrigger>
          <TabsTrigger value="prescriptions">Recent Prescriptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appointments">
          {loading ? (
            <Card>
              <CardContent className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-500">Loading appointments...</p>
                </div>
              </CardContent>
            </Card>          ) : todaysAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No appointments scheduled for today.</p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>Debug info:</p>
                  <p>Total appointments: {totalAppointments}</p>
                  <p>Today&apos;s date: {new Date().toDateString()}</p>
                  <p>Loading: {loading.toString()}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {todaysAppointments.map((appointment) => (
                <Card 
                  key={appointment._id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleAppointmentClick(appointment._id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">                        <span className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-2" />
                          {appointment.name}
                        </span>
                      </CardTitle>
                      <span className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1 text-primary" />
                        {formatAppointmentTime(appointment.appointmentDate)}
                      </span>
                    </div>                    <CardDescription>
                      Age: {appointment.age} • Status: {' '}
                      <span className={`font-medium ${
                        appointment.appointmentStatus === 'completed' ? 'text-green-600' : 
                        appointment.appointmentStatus === 'cancelled' ? 'text-red-600' : 
                        'text-amber-600'
                      }`}>
                        {appointment.appointmentStatus.charAt(0).toUpperCase() + appointment.appointmentStatus.slice(1)}
                      </span>
                      <br />
                      <span className="text-xs text-gray-500">Date: {appointment.appointmentDate}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <strong>Symptoms:</strong> {appointment.symptoms.join(', ')}
                    </div>                    {appointment.caseSummary && appointment.caseSummary.summary && typeof appointment.caseSummary.summary === 'string' && appointment.caseSummary.summary.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {appointment.caseSummary.summary.substring(0, 100)}
                        {appointment.caseSummary.summary.length > 100 ? '...' : ''}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <Button onClick={() => router.push('/doctor/appointments')}>View All Appointments</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="prescriptions">
          {loading ? (
            <Card>
              <CardContent className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-500">Loading prescriptions...</p>
                </div>
              </CardContent>
            </Card>
          ) : recentPrescriptions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">You haven&apos;t created any prescriptions yet.</p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push('/doctor/prescriptions/create')}
                >
                  Create New Prescription
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {recentPrescriptions.map((prescription) => (
                <Card 
                  key={prescription._id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handlePrescriptionClick(prescription._id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">                        <span className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-2" />
                          {prescription.patientName}
                        </span>
                      </CardTitle>
                      <span className="text-sm text-gray-500">
                        {formatDate(prescription.createdAt)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <strong>Diagnosis:</strong> {prescription.diagnosis}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <Button onClick={() => router.push('/doctor/prescriptions')}>View All Prescriptions</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
