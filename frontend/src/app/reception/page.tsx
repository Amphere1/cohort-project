'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiRequest, getCurrentUser, logout } from '@/lib/api';
import { User, Plus, Search, LogOut, Trash, X } from 'lucide-react';

type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  govtRegistrationNumber: string;
  active: boolean;
};

type Appointment = {
  _id: string;
  name: string; // Changed from patientName to name to match API
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
  createdAt: string;
};

export default function ReceptionDashboard() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');    // Form for new patient/appointment
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'male',
    symptoms: [''],
    allergies: [''],
    medicalHistory: [''],
    appointmentReason: '',
    preferredDoctor: 'auto', // Changed from empty string to 'auto'
    appointmentDate: ''
  });
  
  // Refs for polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load data on component mount
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'receptionist') {
      router.push('/login/reception');
      return;
    }    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch active doctors
        const doctorsData = await apiRequest<{data: Doctor[]}>('/api/doctors');
        const activeDoctors = doctorsData.data?.filter(doc => doc.active) || [];
        setDoctors(activeDoctors);
        setFilteredDoctors(activeDoctors);
        
        // Fetch appointments
        const appointmentsData = await apiRequest<{data: Appointment[]}>('/api/patients');
        // Sort appointments by date (most recent first)
        const sortedAppointments = (appointmentsData.data || []).sort((a, b) => 
          new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        );
        setAppointments(sortedAppointments);
        setFilteredAppointments(sortedAppointments);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up polling for real-time updates
    pollingIntervalRef.current = setInterval(fetchData, 10000); // Poll every 10 seconds
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [router]);
  
  // Filter doctors based on search term
  useEffect(() => {
    if (!doctorSearchTerm.trim()) {
      setFilteredDoctors(doctors);
      return;
    }
      const term = doctorSearchTerm.toLowerCase();
    const filtered = doctors.filter(doctor => 
      doctor.name.toLowerCase().includes(term) ||
      doctor.specialization.toLowerCase().includes(term) ||
      doctor.govtRegistrationNumber.toLowerCase().includes(term)
    );
    
    setFilteredDoctors(filtered);
  }, [doctorSearchTerm, doctors]);
  
  // Filter appointments based on search term
  useEffect(() => {
    if (!appointmentSearchTerm.trim()) {
      setFilteredAppointments(appointments);
      return;
    }
    
    const term = appointmentSearchTerm.toLowerCase();
    const filtered = appointments.filter(appointment => 
      appointment.name.toLowerCase().includes(term) ||
      appointment.assignedDoctorName.toLowerCase().includes(term) ||
      appointment.symptoms.some(s => s.toLowerCase().includes(term))
    );
    
    setFilteredAppointments(filtered);
  }, [appointmentSearchTerm, appointments]);
  
  // Handle patient form change
  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: string) => {
    const { value } = e.target;
    setNewPatient(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle dynamic array fields (symptoms, allergies, medical history)
  const handleArrayFieldChange = (index: number, value: string, field: 'symptoms' | 'allergies' | 'medicalHistory') => {
    const updatedArray = [...newPatient[field]];
    updatedArray[index] = value;
    
    setNewPatient(prev => ({
      ...prev,
      [field]: updatedArray
    }));
  };
  
  // Add new item to array field
  const addArrayItem = (field: 'symptoms' | 'allergies' | 'medicalHistory') => {
    setNewPatient(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };
  
  // Remove item from array field
  const removeArrayItem = (index: number, field: 'symptoms' | 'allergies' | 'medicalHistory') => {
    if (newPatient[field].length <= 1) return; // Keep at least one field
    
    const updatedArray = newPatient[field].filter((_, i) => i !== index);
    
    setNewPatient(prev => ({
      ...prev,
      [field]: updatedArray
    }));
  };
  
  // Schedule appointment
  const handleScheduleAppointment = async () => {
    // Basic validation
    if (
      !newPatient.name ||
      !newPatient.age ||
      !newPatient.symptoms[0] ||
      !newPatient.appointmentDate
    ) {
      setError('Please fill all required fields.');
      return;
    }
    
    const symptoms = newPatient.symptoms.filter(s => s.trim() !== '');
    const allergies = newPatient.allergies.filter(a => a.trim() !== '');
    const medicalHistory = newPatient.medicalHistory.filter(m => m.trim() !== '');
    
    if (symptoms.length === 0) {
      setError('Please enter at least one symptom.');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
        // Prepare data for API
      const appointmentData = {
        name: newPatient.name,
        age: parseInt(newPatient.age),
        gender: newPatient.gender,
        symptoms,
        allergies: allergies.length > 0 ? allergies : undefined,
        medicalHistory: medicalHistory.length > 0 ? medicalHistory : undefined,
        appointmentReason: newPatient.appointmentReason || undefined,
        preferredDoctor: (newPatient.preferredDoctor && newPatient.preferredDoctor !== 'auto') ? newPatient.preferredDoctor : undefined,
        appointmentDate: new Date(newPatient.appointmentDate).toISOString()
      };
      
      // Create appointment
      await apiRequest('/api/patients', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
      });
        // Reset form and close dialog
      setNewPatient({
        name: '',
        age: '',
        gender: 'male',
        symptoms: [''],
        allergies: [''],
        medicalHistory: [''],
        appointmentReason: '',
        preferredDoctor: 'auto',
        appointmentDate: ''
      });
      
      setIsScheduleDialogOpen(false);
      
      // Refresh appointments list
      const appointmentsData = await apiRequest<{data: Appointment[]}>('/api/patients');
      const sortedAppointments = (appointmentsData.data || []).sort((a, b) => 
        new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      );
      setAppointments(sortedAppointments);
      setFilteredAppointments(sortedAppointments);
        setSuccess('Appointment scheduled successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to schedule appointment.');
    }
  };
  
  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge color
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
  
  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login/reception');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Reception Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage appointments and patient registrations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
                <DialogDescription>
                  Enter patient information and appointment details.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4 max-h-[65vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">
                      Patient Name*
                    </Label>
                    <Input
                      id="name"
                      value={newPatient.name}
                      onChange={(e) => handlePatientChange(e, 'name')}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age">
                        Age*
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        value={newPatient.age}
                        onChange={(e) => handlePatientChange(e, 'age')}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gender">
                        Gender
                      </Label>
                      <Select 
                        value={newPatient.gender} 
                        onValueChange={(value) => setNewPatient({...newPatient, gender: value})}
                      >
                        <SelectTrigger id="gender" className="mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="block mb-1">
                    Symptoms*
                  </Label>
                  {newPatient.symptoms.map((symptom, index) => (
                    <div key={`symptom-${index}`} className="flex items-center gap-2 mb-2">
                      <Input
                        value={symptom}
                        onChange={(e) => handleArrayFieldChange(index, e.target.value, 'symptoms')}
                        placeholder="Enter symptom"
                      />
                      <Button 
                        type="button" 
                        size="sm"
                        variant="ghost"
                        onClick={() => removeArrayItem(index, 'symptoms')}
                        disabled={newPatient.symptoms.length <= 1}
                      >
                        <Trash className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => addArrayItem('symptoms')}
                  >
                    Add Another Symptom
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block mb-1">
                      Allergies (if any)
                    </Label>
                    {newPatient.allergies.map((allergy, index) => (
                      <div key={`allergy-${index}`} className="flex items-center gap-2 mb-2">
                        <Input
                          value={allergy}
                          onChange={(e) => handleArrayFieldChange(index, e.target.value, 'allergies')}
                          placeholder="Enter allergy"
                        />
                        <Button 
                          type="button" 
                          size="sm"
                          variant="ghost"
                          onClick={() => removeArrayItem(index, 'allergies')}
                          disabled={newPatient.allergies.length <= 1}
                        >
                          <Trash className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => addArrayItem('allergies')}
                    >
                      Add Another Allergy
                    </Button>
                  </div>
                  
                  <div>
                    <Label className="block mb-1">
                      Medical History (if any)
                    </Label>
                    {newPatient.medicalHistory.map((history, index) => (
                      <div key={`history-${index}`} className="flex items-center gap-2 mb-2">
                        <Input
                          value={history}
                          onChange={(e) => handleArrayFieldChange(index, e.target.value, 'medicalHistory')}
                          placeholder="Enter medical condition"
                        />
                        <Button 
                          type="button" 
                          size="sm"
                          variant="ghost"
                          onClick={() => removeArrayItem(index, 'medicalHistory')}
                          disabled={newPatient.medicalHistory.length <= 1}
                        >
                          <Trash className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => addArrayItem('medicalHistory')}
                    >
                      Add Another Condition
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="appointmentReason">
                    Reason for Appointment
                  </Label>
                  <Textarea
                    id="appointmentReason"
                    value={newPatient.appointmentReason}
                    onChange={(e) => handlePatientChange(e, 'appointmentReason')}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDoctor">
                      Preferred Doctor (Optional)
                    </Label>
                    <Select 
                      value={newPatient.preferredDoctor}
                      onValueChange={(value) => setNewPatient({...newPatient, preferredDoctor: value})}
                    >
                      <SelectTrigger id="preferredDoctor" className="mt-1">
                        <SelectValue placeholder="Select a preferred doctor or leave blank for AI assignment" />
                      </SelectTrigger>                      <SelectContent>
                        <SelectItem value="auto">No preference (AI will assign)</SelectItem>
                        {doctors.map(doctor => (
                          <SelectItem key={doctor._id} value={doctor.name}>
                            {doctor.name} ({doctor.specialization})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="appointmentDate">
                      Appointment Date & Time*
                    </Label>
                    <Input
                      id="appointmentDate"
                      type="datetime-local"
                      value={newPatient.appointmentDate}
                      onChange={(e) => handlePatientChange(e, 'appointmentDate')}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleScheduleAppointment}>
                  Schedule Appointment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
          <span className="block sm:inline">{error}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4"
            onClick={() => setError('')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 relative">
          <span className="block sm:inline">{success}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4"
            onClick={() => setSuccess('')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appointments" className="mt-4">
          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search appointments by patient name, assigned doctor, or symptoms..."
              value={appointmentSearchTerm}
              onChange={(e) => setAppointmentSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Appointments table */}
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
                {appointmentSearchTerm ? (
                  <>
                    <p className="text-gray-500 mb-4">No appointments match your search criteria.</p>
                    <Button variant="outline" onClick={() => setAppointmentSearchTerm('')}>
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">No appointments have been scheduled yet.</p>
                    <Button onClick={() => setIsScheduleDialogOpen(true)}>
                      Schedule Your First Appointment
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Symptoms</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map(appointment => (
                      <TableRow key={appointment._id}>
                        <TableCell className="font-medium">
                          {appointment.name}<br/>
                          <span className="text-xs text-gray-500">
                            {appointment.age} years, {appointment.gender}
                          </span>
                        </TableCell>
                        <TableCell>{appointment.assignedDoctorName}</TableCell>
                        <TableCell>{formatDateTime(appointment.appointmentDate)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(appointment.appointmentStatus)}>
                            {appointment.appointmentStatus.charAt(0).toUpperCase() + appointment.appointmentStatus.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {appointment.symptoms.join(', ')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="doctors" className="mt-4">
          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />            <Input
              className="pl-10"
              placeholder="Search doctors by name, specialization, or registration number..."
              value={doctorSearchTerm}
              onChange={(e) => setDoctorSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Doctors table */}
          {loading ? (
            <Card>
              <CardContent className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-500">Loading doctors...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredDoctors.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                {doctorSearchTerm ? (
                  <>
                    <p className="text-gray-500 mb-4">No doctors match your search criteria.</p>
                    <Button variant="outline" onClick={() => setDoctorSearchTerm('')}>
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <p className="text-gray-500">No active doctors found.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">              {filteredDoctors.map(doctor => (
                <Card key={doctor._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-primary" />
                      {doctor.name}
                    </CardTitle>
                    <CardDescription>
                      <div className="space-y-1">
                        <div>{doctor.specialization || 'General Practitioner'}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          Reg: {doctor.govtRegistrationNumber}
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader><CardContent>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setNewPatient({...newPatient, preferredDoctor: doctor.name});
                        setIsScheduleDialogOpen(true);
                      }}
                    >
                      Schedule Appointment
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
