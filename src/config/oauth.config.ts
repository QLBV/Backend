import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import User from "../models/User";
import Patient from "../models/Patient";
import { RoleCode } from "../constant/role";

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          
          let user = await User.findOne({
            where: { email: profile.emails?.[0]?.value },
          });

          if (!user) {
            
            const email = profile.emails?.[0]?.value;
            const fullName = profile.displayName;

            if (!email) {
              return done(
                new Error("EMAIL_NOT_PROVIDED: Google không cung cấp địa chỉ email"),
                undefined
              );
            }

            const randomPassword = Math.random().toString(36).slice(-32) + Date.now().toString(36);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = await User.create({
              email,
              fullName,
              password: hashedPassword, 
              roleId: RoleCode.PATIENT, 
              isActive: true,
              oauth2Provider: "GOOGLE",
              oauth2Id: profile.id,
            });

            
            if (user.roleId === RoleCode.PATIENT) {
              const patient = await Patient.create({
                userId: user.id,
                fullName: user.fullName,
                gender: "OTHER",
                dateOfBirth: new Date(),
              });
              const patientCode = `BN${String(patient.id).padStart(6, "0")}`;
              await patient.update({ patientCode });
            }
          } else {
            
            if (!user.oauth2Provider) {
              await user.update({
                oauth2Provider: "GOOGLE",
                oauth2Id: profile.id,
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
