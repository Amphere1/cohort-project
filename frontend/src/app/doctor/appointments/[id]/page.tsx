'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getCurrentUser, doctorApi } from '@/lib/api';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle,
  ArrowLeft,
  FileText,
  Pill,
  Heart,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

type Appointment = {
  _id: string;
  name: string; // This is the patient name from the backend
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

type Prescription = {
  patientName: string;
  patientAge: number;
  diagnosis: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  generalInstructions: string[];
  followUpInstructions: string;
  lifestyleRecommendations: string[];
  precautions: string[];
  specialistReferrals?: string[];
};

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;
    const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
    // Prescription state
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionGenerated, setPrescriptionGenerated] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(false);
  const [editedPrescription, setEditedPrescription] = useState<Prescription | null>(null);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [drugInteractions, setDrugInteractions] = useState<Array<{
    interaction: string;
    recommendation: string;
    severity: string;
  }> | null>(null);
  const [showInteractions, setShowInteractions] = useState(false);
  
  // Case summary regeneration state
  const [regeneratingSummary, setRegeneratingSummary] = useState(false);
  
  // Doctor's notes and status update
  const [doctorNotes, setDoctorNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'doctor') {
      router.push('/login/doctor');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await doctorApi.getAppointmentById(appointmentId);
        setAppointment(response.data);
        setNewStatus(response.data.appointmentStatus);
      } catch (error) {
        console.error('Failed to fetch appointment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId, router]);const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await doctorApi.getAppointmentById(appointmentId);
      setAppointment(response.data);
      setNewStatus(response.data.appointmentStatus);
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async () => {
    if (!newStatus || newStatus === appointment?.appointmentStatus) return;
    
    try {
      setUpdating(true);
      await doctorApi.updateAppointmentStatus(appointmentId, newStatus);
      await fetchAppointmentDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const generatePrescription = async () => {
    if (!appointment) return;
    
    try {
      setPrescriptionLoading(true);
      
      const patientData = {
        patientName: appointment.name,
        patientAge: appointment.age,
        symptoms: appointment.symptoms,
        allergies: appointment.allergies || [],
        medicalHistory: appointment.medicalHistory || [],
        appointmentReason: appointment.appointmentReason,
        caseSummary: appointment.caseSummary
      };
      
      const response = await doctorApi.generatePrescription(patientData);
      setPrescription(response.prescription);
      setPrescriptionGenerated(true);
      setActiveTab('prescription');
    } catch (error) {
      console.error('Failed to generate prescription:', error);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const savePrescription = async () => {
    if (!prescription || !appointment) return;
    
    try {
      setUpdating(true);
      
      const prescriptionData = {
        originalPrescription: prescription,
        modifications: {
          // Include any doctor modifications here
          doctorNotes: doctorNotes
        },
        patientId: appointment._id,
        appointmentId: appointmentId
      };
      
      await doctorApi.savePrescription(prescriptionData);
      
      // Update appointment status to completed after saving prescription
      if (appointment.appointmentStatus !== 'completed') {
        await doctorApi.updateAppointmentStatus(appointmentId, 'completed');
        await fetchAppointmentDetails();
      }
      
      setActiveTab('details');
    } catch (error) {
      console.error('Failed to save prescription:', error);
    } finally {
      setUpdating(false);
    }
  };  const regenerateCaseSummary = async () => {
    if (!appointment) return;
    
    try {
      setRegeneratingSummary(true);
      
      const response = await doctorApi.regenerateCaseSummary(appointmentId);
      
      if (response.success) {
        // Update the appointment with the new case summary
        setAppointment(prev => prev ? {
          ...prev,
          caseSummary: response.caseSummary
        } : null);
      } else {
        throw new Error(response.message || 'Failed to regenerate case summary');
      }
    } catch (error) {
      console.error('Failed to regenerate case summary:', error);
      // You might want to show a toast notification here
    } finally {
      setRegeneratingSummary(false);
    }
  };

  const startEditingPrescription = () => {
    if (prescription) {
      setEditedPrescription({ ...prescription });
      setEditingPrescription(true);
    }
  };

  const cancelEditingPrescription = () => {
    setEditedPrescription(null);
    setEditingPrescription(false);
  };

  const saveEditedPrescription = () => {
    if (editedPrescription) {
      setPrescription(editedPrescription);
      setEditingPrescription(false);
    }
  };  const checkDrugInteractions = async () => {
    if (!prescription || !prescription.medications) return;
    
    try {
      setCheckingInteractions(true);
      
      const medications = prescription.medications;
      const currentMedications = appointment?.medicalHistory || [];
        const response = await doctorApi.checkDrugInteractions({
        medications,
        currentMedications
      });
      
      // Store interactions for display
      const responseData = response as { interactions?: Array<{
        interaction: string;
        recommendation: string;
        severity: string;
      }> };
      
      if (responseData.interactions) {
        setDrugInteractions(responseData.interactions);
        setShowInteractions(true);
      } else {
        alert('No drug interactions found.');
      }
      
    } catch (error) {
      console.error('Failed to check drug interactions:', error);
      alert('Failed to check drug interactions. Please try again.');
    } finally {
      setCheckingInteractions(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      case 'rescheduled': return 'secondary';
      default: return 'default';
    }  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading appointment details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">Appointment not found.</p>
            <Button onClick={() => router.push('/doctor/appointments')} variant="outline">
              Back to Appointments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => router.push('/doctor/appointments')} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Appointments
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Appointment Details</h1>
            <p className="text-gray-500 mt-1">
              {appointment.name} • {format(new Date(appointment.appointmentDate), 'PPP')}
            </p>
          </div>
        </div>
        <Badge variant={getStatusBadgeVariant(appointment.appointmentStatus)} className="capitalize">
          {appointment.appointmentStatus}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Patient Details</span>
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center space-x-2">
            <Stethoscope className="h-4 w-4" />
            <span>Assessment</span>
          </TabsTrigger>
          <TabsTrigger value="prescription" className="flex items-center space-x-2">
            <Pill className="h-4 w-4" />
            <span>Prescription</span>
          </TabsTrigger>
        </TabsList>

        {/* Patient Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Patient Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-lg">{appointment.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Age</Label>
                    <p>{appointment.age} years</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Gender</Label>
                    <p className="capitalize">{appointment.gender}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Appointment Date</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{format(new Date(appointment.appointmentDate), 'PPP')}</span>
                    <Clock className="h-4 w-4 text-gray-500 ml-4" />
                    <span>{format(new Date(appointment.appointmentDate), 'p')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Symptoms and History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Medical Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Chief Complaints</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {appointment.symptoms.map((symptom, index) => (
                      <Badge key={index} variant="secondary">{symptom}</Badge>
                    ))}
                  </div>
                </div>
                
                {appointment.allergies && appointment.allergies.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>Allergies</span>
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {appointment.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive">{allergy}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {appointment.medicalHistory && appointment.medicalHistory.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Medical History</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {appointment.medicalHistory.map((history, index) => (
                        <Badge key={index} variant="outline">{history}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {appointment.appointmentReason && (
                  <div>
                    <Label className="text-sm font-medium">Reason for Visit</Label>
                    <p className="mt-1 text-sm text-gray-700">{appointment.appointmentReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Appointment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label>Appointment Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={updateAppointmentStatus}
                  disabled={updating || newStatus === appointment.appointmentStatus}
                  className="mt-6"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-6">
          {appointment.caseSummary ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>AI Assessment Summary</span>
                </CardTitle>
              </CardHeader>              <CardContent className="space-y-6">                <div>
                  <Label className="text-sm font-medium">Case Summary</Label>
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                    {appointment.caseSummary?.summary || 'No summary available'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Possible Conditions</Label>
                  <div className="mt-2 space-y-2">
                    {(appointment.caseSummary?.possibleConditions || []).map((condition, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">{condition}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {appointment.caseSummary?.recommendedTests && appointment.caseSummary.recommendedTests.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Recommended Tests</Label>
                    <div className="mt-2 space-y-2">
                      {appointment.caseSummary.recommendedTests.map((test, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{test}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Suggested Questions</Label>
                  <div className="mt-2 space-y-2">
                    {(appointment.caseSummary?.suggestedQuestions || []).map((question, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                        <span className="text-sm">{question}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    onClick={regenerateCaseSummary}
                    disabled={regeneratingSummary}
                    variant="outline"
                    className="w-full"
                  >
                    {regeneratingSummary ? 'Regenerating AI Assessment...' : 'Regenerate AI Assessment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">No AI assessment available for this appointment.</p>
                <Button 
                  onClick={regenerateCaseSummary}
                  disabled={regeneratingSummary}
                  variant="outline"
                >
                  {regeneratingSummary ? 'Generating AI Assessment...' : 'Generate AI Assessment'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Doctor Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Doctor&apos;s Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add your clinical notes, observations, and treatment plan..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows={6}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescription Tab */}
        <TabsContent value="prescription" className="space-y-6">
          {!prescriptionGenerated ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Pill className="h-5 w-5" />
                  <span>Generate Prescription</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <p className="text-gray-500 mb-6">
                  Generate an AI-powered prescription recommendation based on the patient&apos;s symptoms and assessment.
                </p>
                <Button 
                  onClick={generatePrescription} 
                  disabled={prescriptionLoading}
                  size="lg"
                >
                  {prescriptionLoading ? 'Generating...' : 'Generate Prescription'}
                </Button>
              </CardContent>
            </Card>
          ) : prescription ? (
            <div className="space-y-6">              {/* Prescription Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span>Prescription for {prescription.patientName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Patient</Label>
                      <p>{prescription.patientName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Age</Label>
                      <p>{prescription.patientAge} years</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Diagnosis</Label>
                      {editingPrescription && editedPrescription ? (
                        <Textarea
                          value={editedPrescription.diagnosis}
                          onChange={(e) => setEditedPrescription({ ...editedPrescription, diagnosis: e.target.value })}
                          className="mt-1"
                          rows={2}
                        />
                      ) : (
                        <p className="font-medium text-blue-600">{prescription.diagnosis}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>{/* Medications */}
              <Card>
                <CardHeader>
                  <CardTitle>Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(prescription.medications && Array.isArray(prescription.medications) ? prescription.medications : []).map((medication, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        {editingPrescription && editedPrescription ? (
                          // Edit mode
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Medication</Label>
                              <Input
                                value={editedPrescription.medications[index]?.name || ''}
                                onChange={(e) => {
                                  const newMeds = [...editedPrescription.medications];
                                  if (newMeds[index]) {
                                    newMeds[index].name = e.target.value;
                                    setEditedPrescription({ ...editedPrescription, medications: newMeds });
                                  }
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Dosage</Label>
                              <Input
                                value={editedPrescription.medications[index]?.dosage || ''}
                                onChange={(e) => {
                                  const newMeds = [...editedPrescription.medications];
                                  if (newMeds[index]) {
                                    newMeds[index].dosage = e.target.value;
                                    setEditedPrescription({ ...editedPrescription, medications: newMeds });
                                  }
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Frequency</Label>
                              <Input
                                value={editedPrescription.medications[index]?.frequency || ''}
                                onChange={(e) => {
                                  const newMeds = [...editedPrescription.medications];
                                  if (newMeds[index]) {
                                    newMeds[index].frequency = e.target.value;
                                    setEditedPrescription({ ...editedPrescription, medications: newMeds });
                                  }
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Duration</Label>
                              <Input
                                value={editedPrescription.medications[index]?.duration || ''}
                                onChange={(e) => {
                                  const newMeds = [...editedPrescription.medications];
                                  if (newMeds[index]) {
                                    newMeds[index].duration = e.target.value;
                                    setEditedPrescription({ ...editedPrescription, medications: newMeds });
                                  }
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div className="md:col-span-4">
                              <Label className="text-sm font-medium">Instructions</Label>
                              <Textarea
                                value={editedPrescription.medications[index]?.instructions || ''}
                                onChange={(e) => {
                                  const newMeds = [...editedPrescription.medications];
                                  if (newMeds[index]) {
                                    newMeds[index].instructions = e.target.value;
                                    setEditedPrescription({ ...editedPrescription, medications: newMeds });
                                  }
                                }}
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Medication</Label>
                              <p className="font-medium">{medication.name}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Dosage</Label>
                              <p>{medication.dosage}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Frequency</Label>
                              <p>{medication.frequency}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Duration</Label>
                              <p>{medication.duration}</p>
                            </div>
                            {medication.instructions && (
                              <div className="md:col-span-4">
                                <Label className="text-sm font-medium">Instructions</Label>
                                <p className="text-sm text-gray-600 mt-1">{medication.instructions}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>              {/* General Instructions */}
              {prescription.generalInstructions && Array.isArray(prescription.generalInstructions) && prescription.generalInstructions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>General Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingPrescription && editedPrescription ? (
                      // Edit mode for general instructions
                      <div className="space-y-2">
                        {(editedPrescription.generalInstructions || []).map((instruction, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <Input
                              value={instruction}
                              onChange={(e) => {
                                const newInstructions = [...(editedPrescription.generalInstructions || [])];
                                newInstructions[index] = e.target.value;
                                setEditedPrescription({ ...editedPrescription, generalInstructions: newInstructions });
                              }}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newInstructions = editedPrescription.generalInstructions?.filter((_, i) => i !== index) || [];
                                setEditedPrescription({ ...editedPrescription, generalInstructions: newInstructions });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newInstructions = [...(editedPrescription.generalInstructions || []), 'New instruction'];
                            setEditedPrescription({ ...editedPrescription, generalInstructions: newInstructions });
                          }}
                        >
                          Add Instruction
                        </Button>
                      </div>
                    ) : (
                      // View mode for general instructions
                      <ul className="space-y-2">
                        {prescription.generalInstructions.map((instruction, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <span className="text-sm">{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}{/* Actions */}
              <div className="flex flex-wrap justify-end gap-2">
                {editingPrescription ? (
                  // Edit mode actions
                  <>
                    <Button 
                      variant="outline" 
                      onClick={cancelEditingPrescription}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={saveEditedPrescription}
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  // View mode actions
                  <>
                    <Button 
                      variant="outline" 
                      onClick={checkDrugInteractions}
                      disabled={checkingInteractions}
                    >
                      {checkingInteractions ? 'Checking...' : 'Check Interactions'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={startEditingPrescription}
                    >
                      Edit Prescription
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setPrescriptionGenerated(false)}
                    >
                      Regenerate
                    </Button>
                    <Button onClick={savePrescription} disabled={updating}>
                      {updating ? 'Saving...' : 'Save Prescription'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : null}        </TabsContent>
      </Tabs>
      
      {/* Drug Interactions Dialog */}
      <Dialog open={showInteractions} onOpenChange={setShowInteractions}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Drug Interaction Analysis</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {drugInteractions && drugInteractions.length > 0 ? (
              <>
                <div className="text-sm text-gray-600 mb-4">
                  Found {drugInteractions.length} potential drug interaction(s) for this prescription.
                </div>
                {drugInteractions.map((interaction, index) => (
                  <Card key={index} className={`border-l-4 ${
                    interaction.severity === 'high' ? 'border-l-red-500 bg-red-50' :
                    interaction.severity === 'moderate' ? 'border-l-orange-500 bg-orange-50' :
                    'border-l-yellow-500 bg-yellow-50'
                  }`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          Interaction #{index + 1}
                        </CardTitle>
                        <Badge variant={
                          interaction.severity === 'high' ? 'destructive' :
                          interaction.severity === 'moderate' ? 'default' :
                          'secondary'
                        } className="capitalize">
                          {interaction.severity} Risk
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Interaction Details:</Label>
                        <p className="text-sm mt-1">{interaction.interaction}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Recommendation:</Label>
                        <p className="text-sm mt-1 text-blue-700">{interaction.recommendation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowInteractions(false)}>
                    Close
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowInteractions(false);
                      startEditingPrescription();
                    }}
                  >
                    Edit Prescription
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">No Drug Interactions Found</p>
                <p className="text-sm text-gray-600 mt-2">
                  The prescribed medications appear to be safe when taken together.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowInteractions(false)}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
