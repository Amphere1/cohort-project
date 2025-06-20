'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest, getCurrentUser } from '@/lib/api';
import { Calendar, Search, User, ArrowRight } from 'lucide-react';
import { format, isToday, isPast, isFuture } from 'date-fns';

type Appointment = {
  _id: string;
  name: string; // Changed from patientName to name (matches API response)
  patientId: string;
  age: number;
  gender: string;
  symptoms: string[];
  allergies?: string[];
  medicalHistory?: string[];
  assignedDoctorId: string;
  assignedDoctorName: string;
  appointmentStatus: string;
  appointmentDate: string;
  appointmentReason?: string;
  caseSummary?: {
    summary: string;
    possibleConditions: string[];
    recommendedTests: string[];
    suggestedQuestions: string[];
  };
};

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  
  // Load appointments on component mount
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'doctor') {
      router.push('/login/doctor');
      return;
    }

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<{appointments: Appointment[]}>('/api/doctor/appointments');
        
        // Sort appointments by date (most recent first)
        const sortedAppointments = (data.appointments || []).sort((a, b) => 
          new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        );
        
        setAppointments(sortedAppointments);
        setFilteredAppointments(sortedAppointments);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        setLoading(false);
      }
    };
    
    fetchAppointments();
    
    // Set up polling for real-time updates
    const pollInterval = setInterval(fetchAppointments, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, [router]);
  
  // Filter appointments when search term or filters change
  useEffect(() => {
    let filtered = [...appointments];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(appt => 
        appt.name.toLowerCase().includes(term) || 
        (appt.appointmentReason && appt.appointmentReason.toLowerCase().includes(term)) ||
        appt.symptoms.some(s => s.toLowerCase().includes(term))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appt => appt.appointmentStatus === statusFilter);
    }
      // Apply time filter
    if (timeFilter !== 'all') {
      filtered = filtered.filter(appt => {
        const appointmentDate = new Date(appt.appointmentDate);
        
        switch(timeFilter) {
          case 'today':
            return isToday(appointmentDate);
          case 'past':
            return isPast(appointmentDate) && !isToday(appointmentDate);
          case 'upcoming':
            return isFuture(appointmentDate) && !isToday(appointmentDate);
          default:
            return true;
        }
      });
    }
    
    setFilteredAppointments(filtered);
  }, [searchTerm, statusFilter, timeFilter, appointments]);
  
  // View appointment details
  const handleViewAppointment = (id: string) => {
    router.push(`/doctor/appointments/${id}`);
  };
  
  // Format date for display
  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    const isAppointmentToday = isToday(date);
    
    return isAppointmentToday
      ? `Today at ${format(date, 'h:mm a')}`
      : format(date, 'MMM d, yyyy • h:mm a');
  };
  
  // Get badge color based on appointment status
  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage your scheduled appointments</p>
        </div>
        <Button onClick={() => router.push('/doctor/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search by patient name or symptoms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="rescheduled">Rescheduled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Appointments list */}
      {loading ? (
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading appointments...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {searchTerm || statusFilter !== 'all' || timeFilter !== 'all' ? (
              <>
                <p className="text-gray-500 mb-4">No appointments match your current filters.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTimeFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <p className="text-gray-500">No appointments scheduled.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map((appointment) => (
            <Card 
              key={appointment._id} 
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {appointment.name}
                    </span>
                  </CardTitle>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(appointment.appointmentStatus)}`}>
                    {appointment.appointmentStatus.charAt(0).toUpperCase() + appointment.appointmentStatus.slice(1)}
                  </span>
                </div>
                <CardDescription className="mt-1">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatAppointmentDate(appointment.appointmentDate)}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Patient:</strong> {appointment.name}, {appointment.age} years, {appointment.gender}
                  </div>
                  
                  <div className="text-sm">
                    <strong>Symptoms:</strong> {appointment.symptoms.join(', ')}
                  </div>
                  
                  {appointment.appointmentReason && (
                    <div className="text-sm">
                      <strong>Reason:</strong> {appointment.appointmentReason}
                    </div>
                  )}
                    {appointment.caseSummary && appointment.caseSummary.summary && typeof appointment.caseSummary.summary === 'string' && appointment.caseSummary.summary.length > 0 && (
                    <div className="text-sm text-gray-700">
                      <strong>Summary:</strong> {appointment.caseSummary.summary.substring(0, 100)}
                      {appointment.caseSummary.summary.length > 100 ? '...' : ''}
                    </div>
                  )}
                </div>
                
                <Button 
                  className="mt-4 w-full sm:w-auto flex items-center justify-center"
                  onClick={() => handleViewAppointment(appointment._id)}
                >
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
