import verifyToken from './auth.js';

// Middleware to verify the user is authenticated AND is a doctor
const verifyDoctor = (req, res, next) => {
    // First verify they have a valid token
    verifyToken(req, res, (err) => {
        if (err) {
            // If verifyToken would have called next with an error, we pass it along
            return next(err);
        }
        
        // Now check if the user is a doctor
        const user = req.user;
        
        // If the token didn't include isDoctor:true or doctorId
        if (!user.isDoctor || !user.doctorId) {
            return res.status(403).json({ 
                message: 'Access denied. Doctors only.' 
            });
        }
        
        // If we get here, the user is authenticated and is a doctor
        next();
    });
};

export default verifyDoctor;
