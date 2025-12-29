import express from "express";
import passport from "../config/oauth.config";
import { oauthCallback, oauthFailure } from "../controllers/oauth.controller";

const router = express.Router();

/**
 * OAuth Routes
 * Handles Google OAuth authentication
 */

// Google OAuth
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

// OAuth failure route
router.get("/failure", oauthFailure);

export default router;