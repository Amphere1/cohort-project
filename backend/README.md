# Healthcare System Backend

This is a comprehensive healthcare system backend with AI-powered features for patient management, doctor assignment, appointment scheduling, and prescription generation.

## Features

- **User and Doctor Authentication**: Secure login system with JWT tokens
- **Patient Management**: Store and retrieve patient details with full CRUD operations
- **AI-Powered Doctor Assignment**: Automatically assigns the most appropriate doctor based on patient symptoms using AI
- **Automatic Appointment Scheduling**: Creates appointments with the assigned doctor when a patient is added
- **AI-Generated Case Summaries**: Provides potential diagnoses, recommended tests, and suggested questions
- **Prescription Generation**: AI-powered prescription generator with drug interaction analysis
- **Doctor Preferences**: Learning system that adapts to doctor prescription preferences
- **Mobile-Ready API**: RESTful endpoints compatible with any frontend

## Automatic Appointment Creation

When a new patient is added to the system:

1. The AI analyzes the patient's symptoms to determine the most appropriate medical specialization
2. It finds the best available doctor matching that specialization
3. An appointment is automatically created and scheduled for the next business day
4. A comprehensive case summary is generated for the doctor with:
   - Concise clinical summary
   - Possible conditions based on symptoms
   - Recommended diagnostic tests
   - Suggested questions for the doctor to ask

## API Documentation

See [API Testing Guide](./guide.md) for detailed endpoint documentation and testing instructions.

## Sample Doctor Login Credentials

- Dr. Rajesh Jones (Endocrinology)
  Govt Registration: SMC-2020-80437
  Email: rajesh.jones@hospital.com
  Password: doctor123

- Dr. Rajesh Williams (Orthopedics)
  Govt Registration: MCI-2014-11157
  Email: rajesh.williams@hospital.com
  Password: doctor123

- Dr. David Sharma (Neurology)
  Govt Registration: NMC-2017-31608
  Email: david.sharma@hospital.com
  Password: doctor123

- Dr. Michael Brown (Radiology)
  Govt Registration: MCI-2018-31111
  Email: michael.brown@hospital.com
  Password: doctor123

- Dr. Neha Reddy (Neurology)
  Govt Registration: SMC-2013-96089
  Email: neha.reddy@hospital.com
  Password: doctor123

- Dr. Michael Johnson (Neurology)
  Govt Registration: NMC-2010-46683
  Email: michael.johnson@hospital.com
  Password: doctor123

- Dr. David Patel (Orthopedics)
  Govt Registration: NMC-2016-91732
  Email: david.patel@hospital.com
  Password: doctor123

- Dr. Rajesh Shah (Ophthalmology)
  Govt Registration: DMC-2012-40480
  Email: rajesh.shah@hospital.com
  Password: doctor123

- Dr. Sanjay Gupta (Pediatrics)
  Govt Registration: DMC-2021-76323
  Email: sanjay.gupta@hospital.com
  Password: doctor123

- Dr. Aditya Patel (Oncology)
  Govt Registration: SMC-2011-83808
  Email: aditya.patel@hospital.com
  Password: doctor123