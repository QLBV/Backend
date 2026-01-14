import { Router } from "express";
import { sendMessage } from "../controllers/contact.controller";

const router = Router();

// POST /api/contact
router.post("/", sendMessage);

export default router;
