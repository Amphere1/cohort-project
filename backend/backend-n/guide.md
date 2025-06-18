# Healthcare API Testing Guide

This guide provides comprehensive instructions for testing all endpoints in the healthcare API. Each section includes example requests using Postman, expected responses, and any required authentication.

## Table of Contents
- [Environment Setup](#environment-setup)
- [Authentication Endpoints](#authentication-endpoints)
- [Patient Endpoints](#patient-endpoints)
- [Doctor Endpoints](#doctor-endpoints)
- [Prescription Endpoints](#prescription-endpoints)
- [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)

## Environment Setup

Before testing endpoints, set up your environment:

1. Install the required dependencies:
   ```bash
   npm install
   ```

2. Make sure MongoDB is running:
   ```bash
   mongod
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Set up Postman:
   - Download and install Postman from [https://www.postman.com/downloads/](https://www.postman.com/downloads/)
   - Create a new Postman Collection named "Healthcare API"
   - Set up an environment in Postman:
     1. Click on "Environments" in the sidebar
     2. Click "Create Environment" and name it "Healthcare API"
     3. Add a variable named `BASE_URL` with the value `http://localhost:3000`
     4. Add variables `TOKEN` and `DOCTOR_TOKEN` (we'll set these after login)
     5. Save the environment and make sure it's selected

5. Load sample doctors (if needed):
   ```bash
   node seeds/sampleDoctor.js
   ```

## Authentication Endpoints

### User Registration

**Postman Setup:**
1. Create a new POST request in your collection
2. URL: `{{BASE_URL}}/api/auth/register`
3. Headers: Add `Content-Type: application/json`
4. Body: Select "raw" and "JSON", then input:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```
5. Click Send

**Scripts Tab** (to automatically save the token):
```javascript
const response = pm.response.json();
if (response.success && response.data && response.data.token) {
    pm.environment.set("TOKEN", response.data.token);
    console.log("Token saved to environment");
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "testuser",
      "email": "test@example.com",
      "_id": "..."
    }
  }
}
```

### User Login

**Postman Setup:**
1. Create a new POST request in your collection
2. URL: `{{BASE_URL}}/api/auth/login`
3. Headers: Add `Content-Type: application/json`
4. Body: Select "raw" and "JSON", then input:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
5. Click Send

**Scripts Tab** (to automatically save the token):
```javascript
const response = pm.response.json();
if (response.success && response.data && response.data.token) {
    pm.environment.set("TOKEN", response.data.token);
    console.log("Token saved to environment");
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "testuser",
      "email": "test@example.com",
      "_id": "..."
    }
  }
}
```

### Doctor Login

**Postman Setup (Using Government Registration Number):**
1. Create a new POST request in your collection
2. URL: `{{BASE_URL}}/api/auth/doctor-login`
3. Headers: Add `Content-Type: application/json`
4. Body: Select "raw" and "JSON", then input:
```json
{
  "govtRegistrationNumber": "SMC-2020-80437",
  "password": "doctor123"
}
```
5. Click Send

**Alternative (Using Email):**
In the request body, use:
```json
{
  "email": "rajesh.jones@hospital.com",
  "password": "doctor123"
}
```

**Scripts Tab** (to automatically save the doctor token):
```javascript
const response = pm.response.json();
if (response.success && response.data && response.data.token) {
    pm.environment.set("DOCTOR_TOKEN", response.data.token);
    console.log("Doctor token saved to environment");
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "doctor": {
      "name": "Dr. Rajesh Jones",
      "specialization": "Endocrinology",
      "email": "rajesh.jones@hospital.com",
      "_id": "...",
      "registrationNumber": "DR2569842"
    }
  }
}
```

### Doctor Registration

**Postman Setup:**
1. Create a new POST request in your collection
2. URL: `{{BASE_URL}}/api/auth/doctor-register`
3. Headers: Add `Content-Type: application/json`
4. Body: Select "raw" and "JSON", then input:
```json
{
  "name": "Dr. John Smith",
  "govtRegistrationNumber": "NMC-2022-12345",
  "specialization": "Cardiology",
  "experience": 10,
  "contactNumber": "+1234567890",
  "email": "john.smith@hospital.com",
  "password": "doctor123",
  "confirmPassword": "doctor123",
  "qualifications": ["MBBS", "MD", "DM"]
}
```
5. Click Send

**Scripts Tab** (to automatically save the doctor token):
```javascript
const response = pm.response.json();
if (response.success && response.data && response.data.token) {
    pm.environment.set("DOCTOR_TOKEN", response.data.token);
    console.log("Doctor token saved to environment");
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "doctor": {
      "name": "Dr. John Smith",
      "specialization": "Cardiology",
      "email": "john.smith@hospital.com",
      "_id": "...",
      "registrationNumber": "DR2545678"
    }
  }
}
```

### Doctor Setup

**Prerequisite:** First, make sure you've logged in as a user to get a token (should be stored in the `TOKEN` environment variable).

**Postman Setup:**
1. Create a new POST request in your collection
2. URL: `{{BASE_URL}}/api/auth/doctor-setup`
3. Headers: 
   - Add `Content-Type: application/json`
   - Add `Authorization: Bearer {{TOKEN}}`
4. Body: Select "raw" and "JSON", then input:
```json
{
  "name": "Dr. Jane Doe",
  "govtRegistrationNumber": "DMC-2021-67890",
  "specialization": "Dermatology",
  "experience": 8,
  "contactNumber": "+1987654321",
  "email": "jane.doe@hospital.com",
  "password": "doctor456",
  "qualifications": ["MBBS", "MD"]
}
```
5. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor account created successfully",
  "data": {
    "doctor": {
      "name": "Dr. Jane Doe",
      "specialization": "Dermatology",
      "email": "jane.doe@hospital.com",
      "_id": "...",
      "registrationNumber": "DR2534567"
    }
  }
}
```

### Validate Government Registration Number

**Postman Setup:**
1. Create a new GET request in your collection
2. URL: `{{BASE_URL}}/api/auth/validate-govt-registration/NMC-2022-12345`
3. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration number is valid",
  "data": {
    "isValid": true
  }
}
```

### Authentication Documentation

**Postman Setup:**
1. Create a new GET request in your collection
2. URL: `{{BASE_URL}}/api/auth/docs`
3. Click Send

## Patient Endpoints

### Store Patient Details with Automatic Doctor Assignment

Requires authentication token.

**Prerequisite:** Make sure you've logged in as a user and have the token stored in the `TOKEN` environment variable.

**Postman Setup:**
1. Create a new POST request in your collection
2. URL: `{{BASE_URL}}/api/patients`
3. Headers: 
   - Add `Content-Type: application/json`
   - Add `Authorization: Bearer {{TOKEN}}`
4. Body: Select "raw" and "JSON", then input:
```json
{
  "name": "Patient Name",
  "age": 30,
  "symptoms": ["fever", "cough", "headache"],
  "preferredDoctor": "Dr. Rajesh Jones",
  "appointmentReason": "Flu-like symptoms for the past 3 days",
  "gender": "Male",
  "contactNumber": "1234567890",
  "address": "123 Main St, City",
  "medicalHistory": ["Hypertension", "Diabetes"],
  "allergies": ["Penicillin"]
}
```
5. Click Send

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "patient": {
      "_id": "...",
      "name": "Patient Name",
      "age": 30,
      "symptoms": ["fever", "cough", "headache"],
      "preferredDoctor": "Dr. Rajesh Jones",
      "assignedDoctorId": "...",
      "recommendedSpecialization": "General Medicine",
      "appointmentStatus": "scheduled",
      "appointmentDate": "2025-06-19T10:00:00.000Z",
      "appointmentReason": "Flu-like symptoms for the past 3 days",
      "caseSummary": {
        "summary": "30-year-old male presenting with fever, cough, and headache for 3 days",
        "possibleConditions": ["Upper respiratory tract infection", "Influenza", "COVID-19"],
        "recommendedTests": ["CBC", "Chest X-ray"],
        "suggestedQuestions": ["When did the symptoms start?", "Any exposure to sick individuals?"]
      },
      "gender": "Male",
      "contactNumber": "1234567890",
      "address": "123 Main St, City",
      "medicalHistory": ["Hypertension", "Diabetes"],
      "allergies": ["Penicillin"],
      "createdAt": "...",
      "updatedAt": "..."
    },
    "appointment": {
      "doctorId": "...",
      "specialization": "General Medicine",
      "date": "2025-06-19T10:00:00.000Z",
      "status": "scheduled",
      "reason": "Flu-like symptoms for the past 3 days",
      "caseSummary": {
        "summary": "30-year-old male presenting with fever, cough, and headache for 3 days",
        "possibleConditions": ["Upper respiratory tract infection", "Influenza", "COVID-19"],
        "recommendedTests": ["CBC", "Chest X-ray"],
        "suggestedQuestions": ["When did the symptoms start?", "Any exposure to sick individuals?"]
      }
    }
  },
  "message": "Patient record created and appointment scheduled successfully"
}
```

> **Note:** When you create a new patient, the system automatically:
> 1. Analyzes symptoms using AI to determine the most appropriate medical specialization
> 2. Assigns the best available doctor with that specialization (or alternative if none available)
> 3. Creates an appointment scheduled for the next business day
> 4. Generates an AI-powered case summary with possible conditions, recommended tests, and suggested questions
> 5. No additional steps are required to create an appointment - it's handled automatically

### Get All Appointments

Requires authentication token.

**Postman Setup:**
1. Create a new GET request in your collection
2. URL: `{{BASE_URL}}/api/patient/appointments`
3. Headers:
   - Add `Authorization: Bearer {{TOKEN}}`
4. Optional Query Parameters:
   - `status` - Filter by appointment status (e.g., `scheduled`, `completed`, `cancelled`, `rescheduled`)
   - `doctorId` - Filter by assigned doctor ID
   - `startDate` - Filter appointments after this date (YYYY-MM-DD)
   - `endDate` - Filter appointments before this date (YYYY-MM-DD)
5. Click Send

**Example URLs:**
- All appointments: `{{BASE_URL}}/api/patient/appointments`
- Completed appointments: `{{BASE_URL}}/api/patient/appointments?status=completed`
- Appointments for a specific doctor: `{{BASE_URL}}/api/patient/appointments?doctorId=60a12b3c4d5e6f7g8h9i0j1k`
- Date range: `{{BASE_URL}}/api/patient/appointments?startDate=2023-06-01&endDate=2023-06-30`

**Expected Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "name": "Patient Name",
      "age": 30,
      "symptoms": ["fever", "cough", "headache"],
      "assignedDoctorId": {
        "_id": "...",
        "name": "Dr. Sarah Johnson",
        "specialization": "General Medicine",
        "email": "sarah.johnson@example.com",
        "contactNumber": "1234567890"
      },
      "recommendedSpecialization": "General Medicine",
      "appointmentStatus": "scheduled",
      "appointmentDate": "2023-06-19T10:00:00.000Z",
      "caseSummary": {
        "summary": "30-year-old male presenting with fever, cough, and headache for 3 days",
        "possibleConditions": ["Upper respiratory tract infection", "Influenza", "COVID-19"],
        "recommendedTests": ["CBC", "Chest X-ray"],
        "suggestedQuestions": ["When did the symptoms start?", "Any exposure to sick individuals?"]
      }
    },
    {
      "_id": "...",
      "name": "Another Patient",
      "age": 45,
      "symptoms": ["chest pain", "shortness of breath"],
      "assignedDoctorId": {
        "_id": "...",
        "name": "Dr. Michael Wilson",
        "specialization": "Cardiology",
        "email": "michael.wilson@example.com",
        "contactNumber": "0987654321"
      },
      "recommendedSpecialization": "Cardiology",
      "appointmentStatus": "completed",
      "appointmentDate": "2023-06-15T09:00:00.000Z",
      "caseSummary": {
        "summary": "45-year-old presenting with chest pain and shortness of breath",
        "possibleConditions": ["Angina", "Myocardial Infarction", "Anxiety"],
        "recommendedTests": ["ECG", "Troponin", "Stress Test"],
        "suggestedQuestions": ["When does the pain occur?", "Does it radiate to the arm or jaw?"]
      }
    }
  ]
}
```

### Update Appointment Status

Requires authentication token.

**Postman Setup:**
1. Create a new PUT request in your collection
2. URL: `{{BASE_URL}}/api/patient/:patientId/appointment` (replace `:patientId` with actual ID)
3. Headers:
   - Add `Content-Type: application/json`
   - Add `Authorization: Bearer {{TOKEN}}`
4. Body: Select "raw" and "JSON", then input one or more of the following fields:
```json
{
  "appointmentStatus": "completed",
  "appointmentDate": "2023-07-01T10:00:00.000Z",
  "assignedDoctorId": "60a12b3c4d5e6f7g8h9i0j1k"
}
```

**Valid appointment statuses:**
- `scheduled` - Default for new appointments
- `completed` - Appointment has been completed
- `cancelled` - Appointment was cancelled
- `rescheduled` - Appointment was rescheduled to a different time

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "patientId": "...",
    "appointmentStatus": "completed",
    "appointmentDate": "2023-07-01T10:00:00.000Z",
    "assignedDoctorId": "60a12b3c4d5e6f7g8h9i0j1k"
  },
  "message": "Appointment updated successfully"
}
```

### Toggle Appointment Completion Status

Requires authentication token.

**Postman Setup:**
1. Create a new PATCH request in your collection
2. URL: `{{BASE_URL}}/api/patient/:patientId/complete` (replace `:patientId` with actual ID)
3. Headers:
   - Add `Authorization: Bearer {{TOKEN}}`
4. Click Send

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Patient Name",
    "age": 30,
    "appointmentComplete": true,
    "appointmentStatus": "completed",
    "updatedAt": "..."
  },
  "message": "Appointment marked as completed"
}
```

## Doctor Endpoints

### Get All Doctors

**Postman Setup:**
1. Create a new GET request in your collection
2. URL: `{{BASE_URL}}/api/doctors`
3. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "data": {
    "doctors": [
      {
        "_id": "...",
        "name": "Dr. Rajesh Jones",
        "registrationNumber": "DR2569842",
        "specialization": "Endocrinology",
        "experience": 15,
        "contactNumber": "...",
        "email": "rajesh.jones@hospital.com",
        "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "availableHours": {
          "start": "09:00",
          "end": "17:00"
        },
        "qualifications": ["MBBS", "MD", "DM"],
        "active": true,
        "ratings": {
          "average": 4.5,
          "count": 42
        }
      },
      // More doctors...
    ]
  }
}
```

### Get Doctor by ID

**Postman Setup:**
1. Create a new GET request in your collection
2. URL: `{{BASE_URL}}/api/doctors/[doctor-id]` (replace [doctor-id] with an actual ID)
3. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor retrieved successfully",
  "data": {
    "doctor": {
      "_id": "...",
      "name": "Dr. Rajesh Jones",
      "registrationNumber": "DR2569842",
      "specialization": "Endocrinology",
      "experience": 15,
      "contactNumber": "...",
      "email": "rajesh.jones@hospital.com",
      "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "availableHours": {
        "start": "09:00",
        "end": "17:00"
      },
      "qualifications": ["MBBS", "MD", "DM"],
      "bio": "Dr. Rajesh Jones is a highly skilled Endocrinology specialist with 15 years of experience. Specializing in the diagnosis and treatment of complex cases.",
      "active": true,
      "ratings": {
        "average": 4.5,
        "count": 42
      }
    }
  }
}
```

### Filter Doctors

**Postman Setup:**
1. Create a new GET request in your collection
2. URL: Choose one of the following based on your filtering needs:
   - By specialization: `{{BASE_URL}}/api/doctors/filter?specialization=Endocrinology`
   - By experience (minimum): `{{BASE_URL}}/api/doctors/filter?minExperience=10`
   - By rating (minimum): `{{BASE_URL}}/api/doctors/filter?minRating=4`
   - By availability (day): `{{BASE_URL}}/api/doctors/filter?availableDay=Monday`
   - Multiple filters: `{{BASE_URL}}/api/doctors/filter?specialization=Cardiology&minExperience=5&minRating=4&availableDay=Tuesday`
3. Click Send

### Rate Doctor

Requires authentication token.

**Postman Setup:**
1. Create a new POST request in your collection
2. URL: `{{BASE_URL}}/api/doctors/[doctor-id]/rate` (replace [doctor-id] with an actual ID)
3. Headers:
   - Add `Content-Type: application/json`
   - Add `Authorization: Bearer {{TOKEN}}`
4. Body: Select "raw" and "JSON", then input:
```json
{
  "rating": 5
}
```
5. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor rated successfully",
  "data": {
    "averageRating": 4.6,
    "ratingCount": 43
  }
}
```

### Toggle Doctor Active Status

Requires doctor authentication token.

**Prerequisite:** Make sure you've logged in as a doctor and have the token stored in the `DOCTOR_TOKEN` environment variable.

**Postman Setup:**
1. Create a new PATCH request in your collection
2. URL: `{{BASE_URL}}/api/doctors/toggle-status`
3. Headers:
   - Add `Authorization: Bearer {{DOCTOR_TOKEN}}`
4. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor status updated successfully",
  "data": {
    "active": false
  }
}
```

### Update Doctor Profile

Requires doctor authentication token.

**Postman Setup:**
1. Create a new PUT request in your collection
2. URL: `{{BASE_URL}}/api/doctors/profile`
3. Headers:
   - Add `Content-Type: application/json`
   - Add `Authorization: Bearer {{DOCTOR_TOKEN}}`
4. Body: Select "raw" and "JSON", then input:
```json
{
  "bio": "Updated professional biography",
  "qualifications": ["MBBS", "MD", "DM", "FRCS"],
  "availableDays": ["Monday", "Wednesday", "Friday"],
  "availableHours": {
    "start": "10:00",
    "end": "18:00"
  }
}
```
5. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor profile updated successfully",
  "data": {
    "doctor": {
      "_id": "...",
      "name": "Dr. Rajesh Jones",
      "bio": "Updated professional biography",
      "qualifications": ["MBBS", "MD", "DM", "FRCS"],
      "availableDays": ["Monday", "Wednesday", "Friday"],
      "availableHours": {
        "start": "10:00",
        "end": "18:00"
      },
      // Other doctor fields...
    }
  }
}
```

### Search Doctors

**Postman Setup:**
1. Create a new GET request in your collection
2. URL: `{{BASE_URL}}/api/doctors/search?q=cardiology`
3. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Search results",
  "data": {
    "doctors": [
      {
        "_id": "...",
        "name": "Dr. John Smith",
        "registrationNumber": "DR2545678",
        "specialization": "Cardiology",
        // Other doctor fields...
      },
      // More matching doctors...
    ]
  }
}
```

## Prescription Endpoints

### Get AI-Generated Prescription

Requires authentication token.

**Postman Setup:**
1. Create a new POST request in your collection
2. URL: `{{BASE_URL}}/api/prescriptions/generate`
3. Headers:
   - Add `Content-Type: application/json`
   - Add `Authorization: Bearer {{TOKEN}}`
4. Body: Select "raw" and "JSON", then input:
```json
{
  "symptoms": ["fever", "cough", "fatigue"],
  "medicalHistory": ["hypertension"],
  "allergies": ["penicillin"],
  "age": 45,
  "gender": "female"
}
```
5. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Prescription generated successfully",
  "data": {
    "prescription": {
      "patientId": "...",
      "medications": [
        {
          "name": "Paracetamol",
          "dosage": "500mg",
          "frequency": "Every 6 hours",
          "duration": "5 days",
          "instructions": "Take with food"
        },
        {
          "name": "Diphenhydramine",
          "dosage": "25mg",
          "frequency": "Before bedtime",
          "duration": "3 days",
          "instructions": "May cause drowsiness"
        }
      ],
      "advice": "Rest adequately and increase fluid intake. If symptoms worsen or persist beyond 5 days, please consult your doctor.",
      "interactions": [],
      "patientFriendlyNotes": "This medication will help reduce your fever and cough. Make sure to complete the full course even if you feel better."
    }
  }
}
```

### Save Modified Prescription

Requires doctor authentication token.

**Postman Setup:**
1. Create a new POST request in your collection
2. URL: `{{BASE_URL}}/api/prescriptions/save`
3. Headers:
   - Add `Content-Type: application/json`
   - Add `Authorization: Bearer {{DOCTOR_TOKEN}}`
4. Body: Select "raw" and "JSON", then input:
```json
{
  "patientId": "...",
  "originalPrescription": {
    "medications": [
      {
        "name": "Paracetamol",
        "dosage": "500mg",
        "frequency": "Every 6 hours",
        "duration": "5 days",
        "instructions": "Take with food"
      }
    ],
    "advice": "Rest adequately and increase fluid intake.",
    "patientFriendlyNotes": "This medication will help reduce your fever."
  },
  "modifiedPrescription": {
    "medications": [
      {
        "name": "Paracetamol",
        "dosage": "500mg",
        "frequency": "Every 8 hours",
        "duration": "3 days",
        "instructions": "Take after meals"
      },
      {
        "name": "Vitamin C",
        "dosage": "1000mg",
        "frequency": "Once daily",
        "duration": "7 days",
        "instructions": "Take in the morning"
      }
    ],
    "advice": "Rest adequately, increase fluid intake, and avoid strenuous activities for a week.",
    "patientFriendlyNotes": "These medications will help reduce your fever and boost your immunity."
  }
}
```
5. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Prescription saved successfully",
  "data": {
    "prescription": {
      "_id": "...",
      "doctorId": "...",
      "patientId": "...",
      "medications": [
        {
          "name": "Paracetamol",
          "dosage": "500mg",
          "frequency": "Every 8 hours",
          "duration": "3 days",
          "instructions": "Take after meals"
        },
        {
          "name": "Vitamin C",
          "dosage": "1000mg",
          "frequency": "Once daily",
          "duration": "7 days",
          "instructions": "Take in the morning"
        }
      ],
      "advice": "Rest adequately, increase fluid intake, and avoid strenuous activities for a week.",
      "patientFriendlyNotes": "These medications will help reduce your fever and boost your immunity.",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "preferencesUpdated": true
  }
}
```

### Get Patient Prescriptions

Requires authentication token.

**Postman Setup:**
1. Create a new GET request in your collection
2. URL: `{{BASE_URL}}/api/prescriptions`
3. Headers:
   - Add `Authorization: Bearer {{TOKEN}}`
4. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Prescriptions retrieved successfully",
  "data": {
    "prescriptions": [
      {
        "_id": "...",
        "doctorId": "...",
        "doctorName": "Dr. Rajesh Jones",
        "patientId": "...",
        "medications": [
          {
            "name": "Paracetamol",
            "dosage": "500mg",
            "frequency": "Every 8 hours",
            "duration": "3 days",
            "instructions": "Take after meals"
          },
          // More medications...
        ],
        "advice": "Rest adequately, increase fluid intake...",
        "patientFriendlyNotes": "These medications will help...",
        "createdAt": "...",
        "updatedAt": "..."
      },
      // More prescriptions...
    ]
  }
}
```

### Get Doctor Prescriptions

Requires doctor authentication token.

**Postman Setup:**
1. Create a new GET request in your collection
2. URL: `{{BASE_URL}}/api/prescriptions/doctor-prescriptions`
3. Headers:
   - Add `Authorization: Bearer {{DOCTOR_TOKEN}}`
4. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor's prescriptions retrieved successfully",
  "data": {
    "prescriptions": [
      {
        "_id": "...",
        "doctorId": "...",
        "patientId": "...",
        "patientName": "Patient Name",
        "medications": [
          // Medications...
        ],
        "advice": "...",
        "patientFriendlyNotes": "...",
        "createdAt": "...",
        "updatedAt": "..."
      },
      // More prescriptions...
    ]
  }
}
```

### Get Doctor's Prescription Preferences

Requires doctor authentication token.

**Postman Setup:**
1. Create a new GET request in your collection
2. URL: `{{BASE_URL}}/api/prescriptions/preferences`
3. Headers:
   - Add `Authorization: Bearer {{DOCTOR_TOKEN}}`
4. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor preferences retrieved successfully",
  "data": {
    "preferences": {
      "doctorId": "...",
      "medicationPreferences": [
        {
          "condition": "fever",
          "preferred": ["Paracetamol"],
          "avoided": ["Aspirin"]
        },
        {
          "condition": "cough",
          "preferred": ["Dextromethorphan"],
          "avoided": []
        }
      ],
      "dosagePreferences": [
        {
          "medication": "Paracetamol",
          "preferredDosage": "500mg",
          "preferredFrequency": "Every 8 hours"
        }
      ],
      "instructionPreferences": [
        {
          "medication": "Paracetamol",
          "preferredInstructions": "Take after meals"
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### Get Prescription by ID

Requires authentication token (either user or doctor).

**Postman Setup:**
1. Create a new GET request in your collection
2. URL: `{{BASE_URL}}/api/prescriptions/[prescription-id]` (replace [prescription-id] with an actual ID)
3. Headers:
   - Add `Authorization: Bearer {{TOKEN}}` (or use {{DOCTOR_TOKEN}})
4. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Prescription retrieved successfully",
  "data": {
    "prescription": {
      "_id": "...",
      "doctorId": "...",
      "doctorName": "Dr. Rajesh Jones",
      "patientId": "...",
      "medications": [
        // Medications...
      ],
      "advice": "...",
      "patientFriendlyNotes": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### Check Drug Interactions

**Postman Setup:**
1. Create a new POST request in your collection
2. URL: `{{BASE_URL}}/api/prescriptions/check-interactions`
3. Headers:
   - Add `Content-Type: application/json`
4. Body: Select "raw" and "JSON", then input:
```json
{
  "medications": ["paracetamol", "ibuprofen", "warfarin"]
}
```
5. Click Send

**Expected Response:**
```json
{
  "success": true,
  "message": "Drug interactions retrieved successfully",
  "data": {
    "interactions": [
      {
        "drugs": ["ibuprofen", "warfarin"],
        "description": "Increased risk of bleeding when taken together",
        "severity": "high"
      }
    ]
  }
}
```

## Common Issues and Troubleshooting

### Authentication Issues

1. **Invalid Token**:
   - Error: `{ "success": false, "message": "Invalid token" }`
   - Solution: Make sure you're using a valid token from a recent login.
   - In Postman: Check that your {{TOKEN}} environment variable is correctly set and not expired.

2. **Missing Token**:
   - Error: `{ "success": false, "message": "No token provided" }`
   - Solution: Include the Authorization header with your token.
   - In Postman: Add header `Authorization: Bearer {{TOKEN}}`.

3. **Expired Token**:
   - Error: `{ "success": false, "message": "Token expired" }`
   - Solution: Login again to get a new token.
   - In Postman: Re-run the login request which should automatically update the {{TOKEN}} variable.

### Doctor Authentication Issues

1. **Invalid Doctor Credentials**:
   - Error: `{ "success": false, "message": "Invalid government registration number or password" }`
   - Solution: Double-check your government registration number or email and password.
   - In Postman: Verify credentials against the sample doctors created by the seed script.

2. **Doctor Access Required**:
   - Error: `{ "success": false, "message": "Doctor access required" }`
   - Solution: Use a doctor token instead of a regular user token.
   - In Postman: Make sure you're using {{DOCTOR_TOKEN}} instead of {{TOKEN}}.

### API Rate Limiting

If you encounter rate limiting:
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

Wait a minute before trying again or reduce the frequency of your requests.

### Server-Side Errors

For 500 server errors, check:
1. MongoDB connection
2. Environment variables
3. Server logs

### Postman Tips

1. **Collections and Environments**:
   - Create a dedicated collection for each API section (auth, patient, doctor, prescriptions).
   - Save requests after creating them to reuse later.
   - Create environment variables for different deployment environments (dev, staging, prod).

2. **Testing Scripts**:
   - Use the Tests tab to add JavaScript that runs after a request completes.
   - Automatically extract and store tokens:
     ```javascript
     const response = pm.response.json();
     if (response.success && response.data && response.data.token) {
         pm.environment.set("TOKEN", response.data.token);
     }
     ```

3. **Running Multiple Requests**:
   - Create a collection runner to execute multiple requests in sequence.
   - Set up a test flow from authentication to creating and retrieving resources.

### Testing the AI Components

When testing the AI-powered features (prescription generation, doctor assignment), consider:

1. Include extensive patient information to get more accurate results
2. Test with various symptom combinations
3. Test how the system adapts to doctor feedback
4. Check integration with external data sources (OpenFDA)

### Seed Data for Testing

Use the seed script to populate the database with test doctors:

```bash
node seeds/sampleDoctor.js
```

This creates 10 test doctors with the password "doctor123" for easy testing.
