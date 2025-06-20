'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getCurrentUser, doctorApi } from '@/lib/api';
import { 
  Search, 
  Calendar, 
  User, 
  Pill, 
  ArrowRight,
  FileText,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

type DoctorPrescription = {
  _id?: string;
  original: {
    diagnosis: string;
    medications: string[];
  };
  modified: {
    diagnosis: string;
    medications: string[];
  };
  patientAge: number;
  patientGender: string;
  diagnosis: string;
  symptoms: string[];
  timestamp: string;
};

export default function DoctorPrescriptionsPage() {
  const router = useRouter();  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<DoctorPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'doctor') {
      router.push('/login/doctor');
      return;
    }    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const data = await doctorApi.getPrescriptions();        // Sort prescriptions by timestamp (most recent first)
        const sortedPrescriptions = (data.prescriptions || []).sort((a: unknown, b: unknown) =>
          new Date((b as DoctorPrescription).timestamp).getTime() - new Date((a as DoctorPrescription).timestamp).getTime()
        ) as unknown as DoctorPrescription[];
        
        setPrescriptions(sortedPrescriptions);
        setFilteredPrescriptions(sortedPrescriptions);
      } catch (error) {
        console.error('Failed to fetch prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrescriptions();
    
    // Set up polling for real-time updates
    const pollInterval = setInterval(fetchPrescriptions, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, [router]);
  
  // Filter prescriptions when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPrescriptions(prescriptions);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = prescriptions.filter(prescription => 
        prescription.diagnosis.toLowerCase().includes(term) ||
        prescription.symptoms.some(symptom => symptom.toLowerCase().includes(term)) ||
        prescription.modified.medications.some(med => med.toLowerCase().includes(term))
      );
      setFilteredPrescriptions(filtered);
    }
  }, [searchTerm, prescriptions]);
  
  // View prescription details
  const handleViewPrescription = (prescription: DoctorPrescription) => {
    // For now, we'll show prescription details in a modal or new tab
    // Later we can create a detailed prescription view page
    console.log('View prescription:', prescription);
  };
  
  // Format date for display
  const formatPrescriptionDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPP • p');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">My Prescriptions</h1>
          <p className="text-gray-500 mt-1">View and manage your prescription history</p>
        </div>
        <Button onClick={() => router.push('/doctor/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search by diagnosis, symptoms, or medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Prescriptions list */}
      {loading ? (
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading prescriptions...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredPrescriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {searchTerm ? (
              <>
                <p className="text-gray-500 mb-4">No prescriptions match your search.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <Pill className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-gray-500 mb-2">No prescriptions found.</p>
                  <p className="text-sm text-gray-400">
                    Prescriptions you create will appear here.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPrescriptions.map((prescription, index) => (
            <Card 
              key={index} 
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    <span className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {prescription.diagnosis || prescription.modified.diagnosis}
                    </span>
                  </CardTitle>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatPrescriptionDate(prescription.timestamp)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm">
                        <strong>Patient Details:</strong>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Age: {prescription.patientAge} years, {prescription.patientGender}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm">
                        <strong>Symptoms:</strong>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {prescription.symptoms.slice(0, 3).map((symptom, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                        {prescription.symptoms.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{prescription.symptoms.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm mb-2">
                      <strong>Prescribed Medications:</strong>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {prescription.modified.medications.slice(0, 4).map((medication, idx) => (
                        <Badge key={idx} variant="outline" className="flex items-center">
                          <Pill className="h-3 w-3 mr-1" />
                          {medication}
                        </Badge>
                      ))}
                      {prescription.modified.medications.length > 4 && (
                        <Badge variant="outline">
                          +{prescription.modified.medications.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {prescription.original.diagnosis !== prescription.modified.diagnosis && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm text-blue-800">
                        <strong>Modified from:</strong> {prescription.original.diagnosis}
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  className="mt-4 w-full sm:w-auto flex items-center justify-center"
                  onClick={() => handleViewPrescription(prescription)}
                  variant="outline"
                >
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => router.push('/doctor/appointments')}
                variant="outline"
              >
                <User className="h-4 w-4 mr-2" />
                View Appointments
              </Button>
              <Button 
                onClick={() => router.push('/doctor/dashboard')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
