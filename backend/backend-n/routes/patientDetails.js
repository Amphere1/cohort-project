import express from 'express';
import PatientDetail from '../models/patientDeatilsModel.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/patients
 * @desc    Create a new patient record with automatic doctor assignment
 * @access  Private 
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, age, symptoms, preferredDoctor, appointmentReason } = req.body;

    // Default appointment reason if not provided
    const reason = appointmentReason || `Consultation for: ${symptoms.join(', ')}`;

    // Import AI functions for doctor assignment and case summarization
    const { assignDoctorForSymptoms, summarizePatientCase } = await import('../genkit/appointments.js');
    
    console.log('Assigning doctor based on symptoms:', symptoms);
    // Use Genkit to assign the most appropriate doctor based on symptoms
    const doctorAssignment = await assignDoctorForSymptoms({
      symptoms,
      preferredDoctor
    });
    
    console.log('Doctor assignment result:', doctorAssignment);
    
    if (!doctorAssignment || (!doctorAssignment.doctorId && !doctorAssignment.specialization)) {
      return res.status(400).json({
        success: false,
        message: 'Could not assign a doctor. Please try again or specify a preferred doctor.'
      });
    }
    
    // Get patient case summary for the doctor
    console.log('Generating case summary for patient:', name);
    let caseSummary = null;
    if (name && age && symptoms) {
      try {
        caseSummary = await summarizePatientCase({
          name,
          age,
          symptoms,
          appointmentReason: reason
        });
        console.log('Case summary generated successfully');
      } catch (summaryError) {
        console.error('Error generating case summary:', summaryError);
        // Continue with the process even if summary fails
      }
    }

    // Calculate appointment date (next business day)
    const appointmentDate = calculateNextBusinessDay();
    
    // Create new patient with provided details and assigned doctor
    const newPatient = new PatientDetail({
      name,
      age,
      symptoms,
      preferredDoctor,
      assignedDoctorId: doctorAssignment.doctorId,
      recommendedSpecialization: doctorAssignment.specialization,
      appointmentStatus: 'scheduled',
      appointmentDate: appointmentDate,
      appointmentReason: reason,
      appointmentComplete: false,
      caseSummary: caseSummary ? {
        summary: caseSummary.summary,
        possibleConditions: caseSummary.possibleConditions,
        recommendedTests: caseSummary.recommendedTests || [],
        suggestedQuestions: caseSummary.suggestedQuestions
      } : null
    });
    
    // Save the patient
    const savedPatient = await newPatient.save();
    
    // Generate appointment info for response
    const appointmentInfo = {
      doctorId: savedPatient.assignedDoctorId,
      specialization: savedPatient.recommendedSpecialization,
      date: savedPatient.appointmentDate,
      status: savedPatient.appointmentStatus,
      reason: savedPatient.appointmentReason,
      caseSummary: savedPatient.caseSummary
    };
    
    console.log(`Appointment created successfully for ${name} with doctor ID ${appointmentInfo.doctorId}`);
    
    res.status(201).json({
      success: true,
      data: {
        patient: savedPatient,
        appointment: appointmentInfo
      },
      message: 'Patient record created and appointment scheduled successfully'
    });
  } catch (error) {
    console.error('Error creating patient and appointment:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// Helper function to calculate the next business day
function calculateNextBusinessDay() {
  const date = new Date();
  date.setDate(date.getDate() + 1); // Add one day
  
  // If it's a weekend, move to Monday
  if (date.getDay() === 0) { // Sunday
    date.setDate(date.getDate() + 1);
  } else if (date.getDay() === 6) { // Saturday
    date.setDate(date.getDate() + 2);
  }
  
  // Set appointment time to a business hour (e.g., 10:00 AM)
  date.setHours(10, 0, 0, 0);
  
  return date;
}

/**
 * @route   GET /api/patients
 * @desc    Get all patients (with optional filtering)
 * @access  Private
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { completed, doctor, search } = req.query;
    const filter = {};

    // Apply filters if provided
    if (completed === 'true' || completed === 'false') {
      filter.appointmentComplete = completed === 'true';
    }
    
    if (doctor) {
      filter.preferredDoctor = doctor;
    }
    
    // Text search if provided
    let query = PatientDetail.find(filter);
    if (search) {
      query = PatientDetail.find(
        { $text: { $search: search } },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } });
    }
    
    // Execute query
    const patients = await query.sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/patients/:id
 * @desc    Get a single patient by ID
 * @access  Private
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const patient = await PatientDetail.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found - Invalid ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/patients/:id
 * @desc    Update a patient
 * @access  Private
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Find the patient
    let patient = await PatientDetail.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Update patient data
    patient = await PatientDetail.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: patient,
      message: 'Patient record updated successfully'
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/patients/:id/complete
 * @desc    Toggle appointment completion status
 * @access  Private
 */
router.patch('/:id/complete', verifyToken, async (req, res) => {
  try {
    const patient = await PatientDetail.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Toggle the completion status and update appointment status
    patient.appointmentComplete = !patient.appointmentComplete;
    
    if (patient.appointmentComplete) {
      patient.appointmentStatus = 'completed';
    } else {
      patient.appointmentStatus = 'scheduled';
    }
    
    await patient.save();
    
    res.status(200).json({
      success: true,
      data: patient,
      message: `Appointment marked as ${patient.appointmentComplete ? 'completed' : 'incomplete'}`
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/patients/appointments
 * @desc    Get all appointments
 * @access  Private
 */
router.get('/appointments', verifyToken, async (req, res) => {
  try {
    const { status, doctorId, startDate, endDate } = req.query;
    const filter = {};
    
    // Apply filters if provided
    if (status) {
      filter.appointmentStatus = status;
    }
    
    if (doctorId) {
      filter.assignedDoctorId = doctorId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) {
        filter.appointmentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.appointmentDate.$lte = new Date(endDate);
      }
    }
    
    // Get appointments with doctor details
    const appointments = await PatientDetail.find(filter)
      .select('name age symptoms assignedDoctorId recommendedSpecialization appointmentStatus appointmentDate caseSummary')
      .sort({ appointmentDate: 1 })
      .populate('assignedDoctorId', 'name specialization email contactNumber');
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/patients/:id/appointment
 * @desc    Update appointment details
 * @access  Private
 */
router.put('/:id/appointment', verifyToken, async (req, res) => {
  try {
    const { appointmentStatus, appointmentDate, assignedDoctorId } = req.body;
    
    const patient = await PatientDetail.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Update appointment fields
    if (appointmentStatus) patient.appointmentStatus = appointmentStatus;
    if (appointmentDate) patient.appointmentDate = new Date(appointmentDate);
    if (assignedDoctorId) patient.assignedDoctorId = assignedDoctorId;
    
    // Update completion status based on appointment status
    if (appointmentStatus === 'completed') {
      patient.appointmentComplete = true;
    } else if (appointmentStatus === 'scheduled' || appointmentStatus === 'rescheduled') {
      patient.appointmentComplete = false;
    }
    
    await patient.save();
    
    res.status(200).json({
      success: true,
      data: {
        patientId: patient._id,
        appointmentStatus: patient.appointmentStatus,
        appointmentDate: patient.appointmentDate,
        assignedDoctorId: patient.assignedDoctorId
      },
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete a patient
 * @access  Private
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const patient = await PatientDetail.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    await patient.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {},
      message: 'Patient record removed successfully'
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

export default router;