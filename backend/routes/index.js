import express from "express";
import verifyToken from "../middleware/auth.js"

const router = express.Router();

// Import other routes
import authRoutes from "./auth.js";
import doctorRoutes from "./doctor.js";
import patientRoutes from "./patientDetails.js";
import prescriptionsRoutes from "./prescriptions.js";
import voice from './voice.js'

// Sample protected route
router.get('/protected', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Welcome to the protected route' });
});

// Use routes
router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/doctor', doctorRoutes); // Add doctor-specific routes
router.use('/patients', patientRoutes);
router.use('/prescriptions', prescriptionsRoutes);
router.use('/voice', voice );

export default router;