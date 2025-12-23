import { Router } from "express";
import { login, register, refreshToken } from "../controllers/auth.controller";
import { verifyToken } from "@/middlewares/auth.middlewares";

const router = Router();
router.use(verifyToken);

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);

export default router;
