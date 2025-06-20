import jwt from 'jsonwebtoken';
import verifyToken from './auth.js';
import dotenv from 'dotenv';

dotenv.config();

// Middleware to verify the user is authenticated AND is a doctor
const verifyDoctor = (req, res, next) => {
    // First verify they have a valid token
    verifyToken(req, res, (err) => {
        if (err) {
            // If verifyToken would have called next with an error, we pass it along
            return next(err);
        }
        
        // Get the JWT payload to check for doctor-specific fields
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.' 
            });
        }
        
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            
            // Check if the user is a doctor by role or isDoctor flag
            if (decoded.role !== 'doctor' && !decoded.isDoctor) {
                return res.status(403).json({ 
                    message: 'Access denied. Doctors only.' 
                });
            }
            
            // Add decoded data to request for easy access
            req.doctorData = {
                doctorId: decoded.doctorId,
                isDoctor: decoded.isDoctor || decoded.role === 'doctor'
            };
            
            // If we get here, the user is authenticated and is a doctor
            next();
        } catch (jwtError) {
            return res.status(401).json({ 
                message: 'Invalid token.' 
            });
        }
    });
};

export default verifyDoctor;
