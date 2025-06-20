// Test script to verify prescription generation
const fetch = require('node-fetch');

async function testPrescriptionGeneration() {
  try {
    // First, login to get a token
    console.log('Logging in as doctor...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/doctor-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        govtRegistrationNumber: 'SMC-2018-52120',
        password: 'doctor123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.message}`);
    }

    const token = loginData.token;
    console.log('Login successful, token received');

    // Now test prescription generation
    console.log('Testing prescription generation...');
    const prescriptionResponse = await fetch('http://localhost:3001/api/prescriptions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        patientName: 'Test Patient',
        patientAge: 30,
        symptoms: ['headache', 'fever'],
        diagnosis: 'Viral infection',
        medicalHistory: [],
        allergies: [],
        currentMedications: []
      })
    });

    if (!prescriptionResponse.ok) {
      const errorData = await prescriptionResponse.json();
      throw new Error(`Prescription generation failed: ${errorData.message}`);
    }

    const prescriptionData = await prescriptionResponse.json();
    console.log('Prescription generated successfully!');
    console.log('General Instructions type:', typeof prescriptionData.generalInstructions);
    console.log('General Instructions is array:', Array.isArray(prescriptionData.generalInstructions));
    console.log('General Instructions:', prescriptionData.generalInstructions);
    
    if (prescriptionData.medications) {
      console.log('Medications count:', prescriptionData.medications.length);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPrescriptionGeneration();
