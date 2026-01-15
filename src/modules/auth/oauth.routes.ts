import express from "express";
import passport from "../../config/oauth.config";
import { oauthCallback, oauthFailure } from "./oauth.controller";

const router = express.Router();




router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/oauth/failure",
    session: false,
  }),
  oauthCallback
);


router.get("/failure", oauthFailure);

export default router;