// API Utility Functions
import { toast } from 'sonner';
import { buildApiUrl } from './config';

// User roles
export type UserRole = 'admin' | 'doctor' | 'receptionist';

// User interface
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  doctorId?: string; // Only for doctor role
}

// Generic API Response types
export interface ApiResponse<T = unknown> {
  [key: string]: T;
}

export interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  registrationNumber: string;
  active: boolean;
  createdAt: string;
}

export interface Appointment {
  _id: string;
  name: string; // Patient name from backend
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
  [key: string]: unknown;
}

export interface Prescription {
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
  [key: string]: unknown;
}

// Base API request function with error handling
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }  try {
    // Build the full URL using the config helper
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || 'Something went wrong. Please try again.';
      
      // Handle specific error codes
      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (response.status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else {
        toast.error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch (e) {
    console.error('Failed to parse user from localStorage', e);
    return null;
  }
}

// Authenticate user and store data
export async function loginUser(
  endpoint: string, 
  credentials: { [key: string]: string }
): Promise<{user: User, token: string}> {
  const response = await apiRequest<{user: User, token: string, success?: boolean}>(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(credentials),
    }
  );
  
  // Handle both direct response and success wrapper response
  const user = response.user;
  const token = response.token;
    // Store user data and token in localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  return { user, token };
}

// Logout user
export function logoutUser() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}

// Alias for backward compatibility
export const logout = logoutUser;

// Check if user has required role
export function hasRole(requiredRole: UserRole | UserRole[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }
  
  return user.role === requiredRole;
}

// Doctor API functions
export const doctorApi = {  async getAppointments(): Promise<{ appointments: Appointment[] }> {
    return apiRequest('/api/doctor/appointments');
  },  async getAppointmentById(id: string): Promise<{ data: Appointment }> {
    return apiRequest(`/api/doctor/appointments/${id}`);
  },

  async updateAppointmentStatus(id: string, status: string): Promise<ApiResponse> {
    return apiRequest(`/api/patients/${id}/appointment`, {
      method: 'PUT',
      body: JSON.stringify({ appointmentStatus: status }),
    });
  },

  async getPrescriptions(): Promise<{ prescriptions: Prescription[] }> {
    return apiRequest('/api/prescriptions/doctor-prescriptions');
  },
  async generatePrescription(patientData: Record<string, unknown>): Promise<{ prescription: Prescription }> {
    return apiRequest('/api/prescriptions/generate', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  },

  async savePrescription(prescriptionData: Record<string, unknown>): Promise<Prescription> {
    return apiRequest('/api/prescriptions/modify', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    });
  },
  async checkDrugInteractions(data: Record<string, unknown>): Promise<ApiResponse> {
    return apiRequest('/api/prescriptions/interactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async regenerateCaseSummary(appointmentId: string): Promise<{
    success: boolean; 
    caseSummary: {
      summary: string;
      possibleConditions: string[];
      recommendedTests: string[];
      suggestedQuestions: string[];
    }; 
    message?: string;
  }> {
    return apiRequest(`/api/doctor/appointments/${appointmentId}/regenerate-summary`, {
      method: 'POST',
    });
  },
};

// Admin API functions
export const adminApi = {  async getDoctors(): Promise<{ data: Doctor[] }> {
    return apiRequest('/api/doctors');
  },

  async createDoctor(doctorData: Partial<Doctor>): Promise<Doctor> {
    return apiRequest('/api/doctors', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
  },

  async updateDoctor(id: string, doctorData: Partial<Doctor>): Promise<Doctor> {
    return apiRequest(`/api/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctorData),
    });
  },

  async toggleDoctorStatus(id: string): Promise<ApiResponse> {
    return apiRequest(`/api/doctors/${id}/status`, {
      method: 'PATCH',
    });
  },

  async deleteDoctor(id: string): Promise<ApiResponse> {
    return apiRequest(`/api/doctors/${id}`, {
      method: 'DELETE',
    });
  },
};

// Receptionist API functions
export const receptionistApi = {
  async getDoctors(): Promise<{ data: Doctor[] }> {
    return apiRequest('/api/doctors');
  },

  async getAppointments(): Promise<{ data: Appointment[] }> {
    return apiRequest('/api/patients');
  },

  async createAppointment(appointmentData: Partial<Appointment>): Promise<Appointment> {
    return apiRequest('/api/patients', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },

  async updateAppointment(id: string, appointmentData: Partial<Appointment>): Promise<Appointment> {
    return apiRequest(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  },

  async deleteAppointment(id: string): Promise<ApiResponse> {
    return apiRequest(`/api/patients/${id}`, {
      method: 'DELETE',
    });
  },
};
