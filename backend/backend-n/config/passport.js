import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/userModel.js";
import dotenv from 'dotenv';

dotenv.config();

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Automatically extracts "Bearer <token>"
  secretOrKey: process.env.SECRET_KEY,
};

passport.use(
  new JwtStrategy(options, async (payload, done) => {    try {
      const user = await User.findById(payload._id).select('-password');
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;
