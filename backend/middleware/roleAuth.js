import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Middleware to verify admin role
export const verifyAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization').replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
    // Get user from database
    const user = await User.findById(decoded._id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token: User not found' 
      });
    }
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required' 
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token or session expired' 
    });
  }
};

// Middleware to verify receptionist role
export const verifyReceptionist = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization').replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
    // Get user from database
    const user = await User.findById(decoded._id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token: User not found' 
      });
    }
    
    // Check if user has receptionist role or admin role (admins can do everything receptionists can do)
    if (user.role !== 'receptionist' && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Receptionist privileges required' 
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Receptionist auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token or session expired' 
    });
  }
};

// Middleware to verify any authenticated user
export const verifyAny = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization').replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
    // Get user from database
    const user = await User.findById(decoded._id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token: User not found' 
      });
    }
    
    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token or session expired' 
    });
  }
};

// Middleware to verify doctor or receptionist role (for appointment management)
export const verifyDoctorOrReceptionist = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization').replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
    // Get user from database
    const user = await User.findById(decoded._id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token: User not found' 
      });
    }
    
    // Check if user has doctor, receptionist, or admin role
    if (user.role !== 'doctor' && user.role !== 'receptionist' && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Doctor or receptionist privileges required' 
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    
    // If it's a doctor, also add doctor-specific data from JWT
    if (user.role === 'doctor' || decoded.isDoctor) {
      req.doctorData = {
        doctorId: decoded.doctorId,
        isDoctor: decoded.isDoctor || decoded.role === 'doctor'
      };
    }
    
    next();
  } catch (error) {
    console.error('Doctor/Receptionist auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token or session expired' 
    });
  }
};
