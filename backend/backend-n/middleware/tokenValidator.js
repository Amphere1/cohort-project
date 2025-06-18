import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const validateToken = (token) => {
    try {
        return jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
        return null;
    }
};

export const getTokenStatus = (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = validateToken(token);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        return res.json({ valid: true, user: decoded });
    } catch (error) {
        return res.status(500).json({ message: 'Error validating token' });
    }
};

export default validateToken;
