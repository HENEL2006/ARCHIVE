import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import generateReferralCode from "../utils/generateReferralCode.js";
import Referral from "../models/referral.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        if (user) {
          if (user.isBlocked) {
            return done(null, false, {
              message: "YOUR ACCOUNT HAS BEEN BLOCKED",
            });
          }

          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }

          delete req.session.googleReferralCode;

          return done(null, user);
        }

        const referralCode = req.session.googleReferralCode;

        let referredBy = null;

        if (referralCode) {
          const referrer = await User.findOne({
            referralCode: referralCode.trim().toUpperCase(),
            isDeleted: false,
            isBlocked: false,
          });

          if (referrer) {
            referredBy = referrer._id;
          }
        }

        const newReferralCode = await generateReferralCode();
        user = await User.create({
          username: profile.displayName,
          email,
          googleId: profile.id,
          role: "user",
          referralCode: newReferralCode,
          referredBy,
        });

        user.customerId = `CUS-${user._id.toString().slice(-6).toUpperCase()}`;

        await user.save();

        if (referredBy) {
          await Referral.create({
            referrer: referredBy,
            referredUser: user._id,
            referralCode: referralCode.trim().toUpperCase(),
            status: "PENDING",
          });
        }

        delete req.session.googleReferralCode;

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
