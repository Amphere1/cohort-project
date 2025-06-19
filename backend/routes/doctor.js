import express from 'express';
import Doctor from '../models/doctorModel.js';
import verifyToken from '../middleware/auth.js';
import { verifyAdmin, verifyReceptionist } from '../middleware/roleAuth.js';

const router = express.Router();

/**
 * @route   POST /api/doctors
 * @desc    Create a new doctor record
 * @access  Private - Admin only
 */
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      govtRegistrationNumber,
      specialization,
      experience,
      contactNumber,
      email,
      availableDays,
      availableHours,
      qualifications,
      bio,
      userId
    } = req.body;

    // Check if doctor already exists with same email or govt registration
    const existingDoctor = await Doctor.findOne({
      $or: [
        { email },
        { govtRegistrationNumber }
      ]
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: existingDoctor.email === email 
          ? 'Doctor with this email already exists' 
          : 'Doctor with this government registration number already exists'
      });
    }

    // Create new doctor
    const newDoctor = new Doctor({
      name,
      govtRegistrationNumber,
      specialization,
      experience,
      contactNumber,
      email,
      availableDays,
      availableHours,
      qualifications,
      bio,
      userId
    });

    const savedDoctor = await newDoctor.save();

    res.status(201).json({
      success: true,
      data: savedDoctor,
      message: 'Doctor record created successfully'
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    
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
 * @route   GET /api/doctors
 * @desc    Get all doctors with optional filtering
 * @access  Public
 */
router.get('/', verifyReceptionist, async (req, res) => {
  try {
    const { specialization, active, search, sort } = req.query;
    const filter = {};

    // Apply filters
    if (specialization) {
      filter.specialization = specialization;
    }
    
    if (active === 'true' || active === 'false') {
      filter.active = active === 'true';
    }
    
    // Build query
    let query;
    
    // Text search if provided
    if (search) {
      query = Doctor.find(
        { 
          $and: [
            filter,
            { $text: { $search: search } }
          ]
        },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } });
    } else {
      query = Doctor.find(filter);
      
      // Apply sorting
      if (sort) {
        const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
        const sortOrder = sort.startsWith('-') ? -1 : 1;
        const sortOptions = {};
        sortOptions[sortField] = sortOrder;
        query = query.sort(sortOptions);
      } else {
        // Default sort by name
        query = query.sort({ name: 1 });
      }
    }
    
    const doctors = await query.exec();
    
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/doctors/:id
 * @desc    Get a single doctor by ID
 * @access  Public
 */
router.get('/:id', verifyReceptionist, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found - Invalid ID'
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
 * @route   GET /api/doctors/reg/:number
 * @desc    Get doctor by registration number
 * @access  Public
 */
router.get('/reg/:number', verifyAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ 
      $or: [
        { registrationNumber: req.params.number },
        { govtRegistrationNumber: req.params.number }
      ]
    });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'No doctor found with this registration number'
      });
    }
    
    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error fetching doctor by registration:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/doctors/:id
 * @desc    Update a doctor record
 * @access  Private
 */
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    // Check if the doctor exists
    let doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    // If updating email or govt reg number, check for duplicates
    if (req.body.email || req.body.govtRegistrationNumber) {
      const duplicateCheck = await Doctor.findOne({
        $and: [
          { _id: { $ne: req.params.id } }, // Not the current doctor
          {
            $or: [
              { email: req.body.email || '' },
              { govtRegistrationNumber: req.body.govtRegistrationNumber || '' }
            ]
          }
        ]
      });
      
      if (duplicateCheck) {
        return res.status(400).json({
          success: false,
          message: duplicateCheck.email === req.body.email 
            ? 'This email is already used by another doctor' 
            : 'This government registration number is already used by another doctor'
        });
      }
    }
    
    // Prevent updating immutable fields
    if (req.body.registrationNumber) {
      delete req.body.registrationNumber;
    }
    
    // Update doctor data
    doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: doctor,
      message: 'Doctor record updated successfully'
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    
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
 * @route   PATCH /api/doctors/:id/status
 * @desc    Toggle doctor's active status
 * @access  Private
 */
router.patch('/:id/status', verifyAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    doctor.active = !doctor.active;
    await doctor.save();
    
    res.status(200).json({
      success: true,
      data: doctor,
      message: `Doctor status set to ${doctor.active ? 'active' : 'inactive'}`
    });
  } catch (error) {
    console.error('Error updating doctor status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/doctors/:id/rate
 * @desc    Add rating for a doctor
 * @access  Private
 */
router.post('/:id/rate', verifyReceptionist, async (req, res) => {
  try {
    const { rating } = req.body;
    
    // Validate rating
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5'
      });
    }
    
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    // Calculate new average
    const totalRatings = doctor.ratings.average * doctor.ratings.count;
    const newCount = doctor.ratings.count + 1;
    const newAverage = (totalRatings + ratingNum) / newCount;
    
    // Update doctor ratings
    doctor.ratings = {
      average: parseFloat(newAverage.toFixed(1)),
      count: newCount
    };
    
    await doctor.save();
    
    res.status(200).json({
      success: true,
      data: doctor.ratings,
      message: 'Rating added successfully'
    });
  } catch (error) {
    console.error('Error rating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/doctors/:id
 * @desc    Delete a doctor
 * @access  Private (Admin)
 */
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    await doctor.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {},
      message: 'Doctor record removed successfully'
    });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/doctors/specializations
 * @desc    Get list of all specializations
 * @access  Public
 */
router.get('/list/specializations', verifyReceptionist, async (req, res) => {
  try {
    const specializations = await Doctor.distinct('specialization');
    
    res.status(200).json({
      success: true,
      count: specializations.length,
      data: specializations
    });
  } catch (error) {
    console.error('Error fetching specializations:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

export default router;