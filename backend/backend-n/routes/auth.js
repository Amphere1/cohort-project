import express from "express";
import User from "../models/userModel.js";
import Doctor from "../models/doctorModel.js"; // Import Doctor model
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// User registration route - admin only
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });        await user.save();

        // Create and sign JWT
        const token = jwt.sign(
            {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            process.env.SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(201).json({
    token,
    user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
    }
});
    } catch (error) {
    res.status(500).json({ message: error.message });
}
});

// User login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }        // Create and sign JWT with user role
        const token = jwt.sign(
            {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            process.env.SECRET_KEY,
            { expiresIn: '7d' } // Extended token expiration to 7 days for convenience
        );

        res.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Token verification route
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findById(decoded._id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Token verification failed' });
    }
});

// Doctor login route using government registration number
router.post('/doctor-login', async (req, res) => {
    try {
        const { govtRegistrationNumber, password } = req.body;

        if (!govtRegistrationNumber || !password) {
            return res.status(400).json({ 
                message: 'Government registration number and password are required' 
            });
        }        // Find doctor by government registration number
        const doctor = await Doctor.findOne({ govtRegistrationNumber }).select('+password');
        if (!doctor) {
            return res.status(400).json({ 
                message: 'Invalid government registration number or doctor account not found' 
            });
        }

        let validPassword = false;
        let user = null;

        // First try doctor's own password if it exists
        if (doctor.password) {
            validPassword = await doctor.comparePassword(password);
        }
        
        // If doctor password doesn't exist or is invalid, try the linked user account
        if (!validPassword && doctor.userId) {
            // Find user by ID from doctor record
            user = await User.findById(doctor.userId);
            if (user) {
                validPassword = await bcrypt.compare(password, user.password);
            }
        }

        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // If we authenticated through the doctor model but have no user, create a minimal user object
        if (!user) {
            user = {
                _id: doctor._id,
                username: doctor.email.split('@')[0],
                email: doctor.email
            };
        }

        // Create and sign JWT with additional doctor info
        const token = jwt.sign(
            {
                _id: user._id,
                doctorId: doctor._id,
                username: user.username,
                email: user.email,
                govtRegistrationNumber: doctor.govtRegistrationNumber,
                registrationNumber: doctor.registrationNumber,
                isDoctor: true
            },
            process.env.SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            },
            doctor: {
                _id: doctor._id,
                name: doctor.name,
                registrationNumber: doctor.registrationNumber,
                govtRegistrationNumber: doctor.govtRegistrationNumber,
                specialization: doctor.specialization
            }
        });
    } catch (error) {
        console.error("Doctor login error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Endpoint to validate if a government registration number exists
router.get('/validate-govt-registration/:number', async (req, res) => {
    try {
        const govtRegistrationNumber = req.params.number;
        
        // Check if the registration number format is valid
        const regNumberRegex = /^[A-Za-z0-9-]{5,20}$/;
        if (!regNumberRegex.test(govtRegistrationNumber)) {
            return res.status(400).json({
                isValid: false,
                message: 'Invalid government registration number format'
            });
        }
        
        // Check if a doctor with this government registration number exists
        const doctor = await Doctor.findOne({ govtRegistrationNumber });
        
        if (doctor) {
            // Return minimal information for security reasons
            return res.status(200).json({
                isValid: true,
                message: 'Valid government registration number',
                doctor: {
                    name: doctor.name,
                    specialization: doctor.specialization
                }
            });
        } else {
            return res.status(404).json({
                isValid: false,
                message: 'No doctor found with this government registration number'
            });
        }
    } catch (error) {
        console.error("Validation error:", error);
        res.status(500).json({ 
            isValid: false,
            message: 'Error validating government registration number'
        });
    }
});

// Direct doctor registration route (for administrators or self-registration)
router.post('/doctor-register', async (req, res) => {
    try {
        const { 
            name, 
            govtRegistrationNumber, 
            specialization, 
            experience, 
            contactNumber, 
            email, 
            password,
            confirmPassword,
            qualifications
        } = req.body;

        // Validate required fields
        if (!name || !govtRegistrationNumber || !specialization || 
            !experience || !contactNumber || !email || 
            !password || !qualifications) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Check if doctor already exists with the same government registration number or email
        const existingDoctor = await Doctor.findOne({ 
            $or: [
                { govtRegistrationNumber },
                { email }
            ]
        });

        if (existingDoctor) {
            return res.status(400).json({ 
                message: existingDoctor.govtRegistrationNumber === govtRegistrationNumber
                    ? 'Government registration number already registered'
                    : 'Email already registered'
            });
        }

        // Create new doctor with direct password
        const newDoctor = new Doctor({
            name,
            govtRegistrationNumber,
            specialization,
            experience,
            contactNumber,
            email,
            password, // Will be hashed in pre-save hook
            qualifications: Array.isArray(qualifications) ? qualifications : [qualifications]
        });

        await newDoctor.save();

        // Create and sign JWT
        const token = jwt.sign(
            {
                _id: newDoctor._id,
                doctorId: newDoctor._id,
                email: newDoctor.email,
                govtRegistrationNumber: newDoctor.govtRegistrationNumber,
                registrationNumber: newDoctor.registrationNumber,
                isDoctor: true
            },
            process.env.SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Doctor registered successfully',
            token,
            doctor: {
                _id: newDoctor._id,
                name: newDoctor.name,
                registrationNumber: newDoctor.registrationNumber,
                govtRegistrationNumber: newDoctor.govtRegistrationNumber,
                specialization: newDoctor.specialization
            }
        });
    } catch (error) {
        console.error("Doctor registration error:", error);
        
        // Handle validation errors specifically
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                message: 'Validation error',
                errors: messages
            });
        }
        
        res.status(500).json({ message: error.message });
    }
});

// Route for doctors to set up their account (first time) or reset password
router.post('/doctor-setup', async (req, res) => {
    try {
        const { govtRegistrationNumber, email, password, confirmPassword } = req.body;

        // Validate input
        if (!govtRegistrationNumber || !email || !password || !confirmPassword) {
            return res.status(400).json({ 
                message: 'All fields are required: government registration number, email, password, and confirmPassword' 
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }        // Find doctor by government registration number
        const doctor = await Doctor.findOne({ govtRegistrationNumber });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found with this government registration number' });
        }

        // Check if this email is already registered with another user
        const existingUser = await User.findOne({ 
            email,
            _id: { $ne: doctor.userId } // Exclude the doctor's existing user if any
        });

        if (existingUser) {
            return res.status(400).json({ message: 'This email is already registered with another account' });
        }

        let user;

        // Update the doctor model with the new email and password
        doctor.email = email;
        doctor.password = password; // Will be hashed in the pre-save hook
        
        // Check if doctor already has a user account - maintain backward compatibility
        if (doctor.userId) {
            // Update existing user account
            user = await User.findById(doctor.userId);
            
            if (!user) {
                // Create a new user if the referenced one doesn't exist anymore
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                
                user = new User({
                    username: email.split('@')[0], // Generate username from email
                    email,
                    password: hashedPassword
                });
                await user.save();
                
                // Update doctor with new userId
                doctor.userId = user._id;
            } else {
                // Update existing user
                user.email = email;
                
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                user.password = hashedPassword;
                
                await user.save();
            }
        } else {
            // Create new user account to maintain compatibility
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            user = new User({
                username: email.split('@')[0], // Generate username from email
                email,
                password: hashedPassword
            });
            await user.save();
            
            // Link doctor to user
            doctor.userId = user._id;
        }
        
        // Save the doctor with the updated password
        await doctor.save();

        // Create and sign JWT
        const token = jwt.sign(
            {
                _id: user._id,
                doctorId: doctor._id,
                username: user.username,
                email: user.email,
                govtRegistrationNumber: doctor.govtRegistrationNumber,
                isDoctor: true
            },
            process.env.SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Doctor account setup successful',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            },
            doctor: {
                _id: doctor._id,
                name: doctor.name,
                registrationNumber: doctor.registrationNumber,
                govtRegistrationNumber: doctor.govtRegistrationNumber,
                specialization: doctor.specialization
            }
        });
    } catch (error) {
        console.error("Doctor setup error:", error);
        res.status(500).json({ message: 'Server error during doctor account setup' });
    }
});

export default router;
