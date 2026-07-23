import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        if (user) {
          if (user.isBlocked) {
            return done(null, false, {
              message: "YOUR ACCOUNT HAS BEEN BLOCKED",
            });
          }
          // Link Google account if it's not linked yet
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }

          return done(null, user);
        }

        // Create new user
        user = await User.create({
          username: profile.displayName,
          email,
          googleId: profile.id,
          role: "user",
        });

        // Use the actual user's _id for the customerId
        user.customerId = `CUS-${user._id.toString().slice(-6).toUpperCase()}`;
        await user.save();

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

export default passport;
