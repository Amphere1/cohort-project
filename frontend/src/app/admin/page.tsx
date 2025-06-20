'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, getCurrentUser, logout } from '@/lib/api';
import { Search, Edit, Trash2, LogOut, UserPlus, Check, X, User, Mail, Phone } from 'lucide-react';

type Doctor = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  registrationNumber: string;
  active: boolean;
  createdAt: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    registrationNumber: '',
    password: ''
  });
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Load doctors on component mount
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.push('/login/admin');
      return;
    }

    const fetchDoctors = async () => {      try {
        setLoading(true);
        const data = await apiRequest<{data: Doctor[]}>('/api/doctors');
        setDoctors(data.data || []);
        setFilteredDoctors(data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
        setLoading(false);
      }
    };
    
    fetchDoctors();
    
    // Set up polling for real-time updates
    const pollInterval = setInterval(fetchDoctors, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, [router]);
  
  // Filter doctors based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDoctors(doctors);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = doctors.filter(doctor => 
      doctor.name.toLowerCase().includes(term) ||
      doctor.email.toLowerCase().includes(term) ||
      doctor.specialization.toLowerCase().includes(term) ||
      doctor.registrationNumber.toLowerCase().includes(term)
    );
    
    setFilteredDoctors(filtered);
  }, [searchTerm, doctors]);
  
  // Handle new doctor form change
  const handleNewDoctorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDoctor(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle edit doctor form change
  const handleEditDoctorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingDoctor) {
      setEditingDoctor({
        ...editingDoctor,
        [name]: value
      });
    }
  };
  
  // Add new doctor
  const handleAddDoctor = async () => {
    // Basic validation
    if (!newDoctor.name || !newDoctor.email || !newDoctor.registrationNumber || !newDoctor.password) {
      setError('Please fill all required fields.');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
        await apiRequest('/api/doctors', {
        method: 'POST',
        body: JSON.stringify(newDoctor)
      });
      
      // Reset form and close dialog
      setNewDoctor({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        registrationNumber: '',
        password: ''
      });
      setIsAddDialogOpen(false);
        // Refresh doctors list
      const data = await apiRequest<{data: Doctor[]}>('/api/doctors');
      setDoctors(data.data || []);
      setFilteredDoctors(data.data || []);
      
      setSuccess('Doctor added successfully!');
      setTimeout(() => setSuccess(''), 5000);    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to add doctor.');
    }
  };
  
  // Update doctor
  const handleUpdateDoctor = async () => {
    if (!editingDoctor) return;
    
    // Basic validation
    if (!editingDoctor.name || !editingDoctor.email || !editingDoctor.registrationNumber) {
      setError('Please fill all required fields.');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
        await apiRequest(`/api/doctors/${editingDoctor._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingDoctor.name,
          email: editingDoctor.email,
          phone: editingDoctor.phone,
          specialization: editingDoctor.specialization,
          registrationNumber: editingDoctor.registrationNumber,
          active: editingDoctor.active
        })
      });
      
      // Close dialog and refresh doctors list
      setIsEditDialogOpen(false);
        const data = await apiRequest<{data: Doctor[]}>('/api/doctors');
      setDoctors(data.data || []);
      setFilteredDoctors(data.data || []);
      
      setSuccess('Doctor updated successfully!');
      setTimeout(() => setSuccess(''), 5000);    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to update doctor.');
    }
  };
  
  // Toggle doctor active status
  const toggleDoctorStatus = async (doctorId: string, currentStatus: boolean) => {
    try {
      setError('');
      setSuccess('');
        await apiRequest(`/api/doctors/${doctorId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentStatus })
      });
      
      // Update local state
      const updatedDoctors = doctors.map(doctor => {
        if (doctor._id === doctorId) {
          return { ...doctor, active: !currentStatus };
        }
        return doctor;
      });
      
      setDoctors(updatedDoctors);
      setFilteredDoctors(updatedDoctors.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
      setSuccess(`Doctor ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
      setTimeout(() => setSuccess(''), 5000);    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to update doctor status.');
    }
  };
  
  // Delete doctor
  const handleDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    
    try {
      setError('');
      setSuccess('');
        await apiRequest(`/api/doctors/${doctorToDelete._id}`, {
        method: 'DELETE'
      });
      
      // Update local state
      const updatedDoctors = doctors.filter(doctor => doctor._id !== doctorToDelete._id);
      setDoctors(updatedDoctors);
      setFilteredDoctors(updatedDoctors);
      
      setDoctorToDelete(null);
      setIsDeleteDialogOpen(false);
      
      setSuccess('Doctor deleted successfully!');
      setTimeout(() => setSuccess(''), 5000);    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to delete doctor.');
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login/admin');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage doctors and system settings</p>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
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
      
      <Tabs defaultValue="doctors" className="w-full">
        <TabsList>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="doctors">
          {/* Actions bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 mt-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search by name, email, specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Doctor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Doctor</DialogTitle>
                  <DialogDescription>
                    Enter the new doctor&apos;s details. The doctor will use their registration number and password to log in.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name*
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={newDoctor.name}
                      onChange={handleNewDoctorChange}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email*
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={newDoctor.email}
                      onChange={handleNewDoctorChange}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={newDoctor.phone}
                      onChange={handleNewDoctorChange}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="specialization" className="text-right">
                      Specialization
                    </Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      value={newDoctor.specialization}
                      onChange={handleNewDoctorChange}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="registrationNumber" className="text-right">
                      Registration No.*
                    </Label>
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      value={newDoctor.registrationNumber}
                      onChange={handleNewDoctorChange}
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password*
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={newDoctor.password}
                      onChange={handleNewDoctorChange}
                      className="col-span-3"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleAddDoctor}>
                    Add Doctor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Doctors list */}
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
                {searchTerm ? (
                  <>
                    <p className="text-gray-500 mb-4">No doctors match your search criteria.</p>
                    <Button variant="outline" onClick={() => setSearchTerm('')}>
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">No doctors have been added yet.</p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      Add Your First Doctor
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor._id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        <span className="flex items-center">
                          <User className="h-5 w-5 mr-2 text-primary" />
                          {doctor.name}
                        </span>
                      </CardTitle>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        doctor.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {doctor.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <CardDescription>
                      {doctor.specialization || 'General Practitioner'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        {doctor.email}
                      </div>
                      {doctor.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {doctor.phone}
                        </div>
                      )}
                      <div className="text-sm">
                        <strong>Registration:</strong> {doctor.registrationNumber}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setEditingDoctor(doctor);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant={doctor.active ? "destructive" : "outline"} 
                        size="sm"
                        className="gap-1"
                        onClick={() => toggleDoctorStatus(doctor._id, doctor.active)}
                      >
                        {doctor.active ? (
                          <>
                            <X className="h-3.5 w-3.5" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Activate
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setDoctorToDelete(doctor);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Additional admin settings will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Doctor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>
              Update the doctor&apos;s details.
            </DialogDescription>
          </DialogHeader>
          
          {editingDoctor && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editingDoctor.name}
                  onChange={handleEditDoctorChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={editingDoctor.email}
                  onChange={handleEditDoctorChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={editingDoctor.phone}
                  onChange={handleEditDoctorChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-specialization" className="text-right">
                  Specialization
                </Label>
                <Input
                  id="edit-specialization"
                  name="specialization"
                  value={editingDoctor.specialization}
                  onChange={handleEditDoctorChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-registrationNumber" className="text-right">
                  Registration No.
                </Label>
                <Input
                  id="edit-registrationNumber"
                  name="registrationNumber"
                  value={editingDoctor.registrationNumber}
                  onChange={handleEditDoctorChange}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdateDoctor}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the doctor account for {doctorToDelete?.name}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoctor}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
