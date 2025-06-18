import passport from "passport";

const verifyToken = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            console.error('Auth error:', err);
            return res.status(500).json({ message: 'Authentication error' });
        }
        
        if (!user) {
            console.log('Auth failed:', info?.message);
            return res.status(401).json({ message: info?.message || 'Unauthorized' });
        }

        req.user = user;
        next();
    })(req, res, next);
};

export default verifyToken;