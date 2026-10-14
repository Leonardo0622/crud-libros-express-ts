import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { loginRateLimiter } from "../middleware/rateLimit";
import * as ctrl from "../controllers/authController";

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, ctrl.login);
authRouter.post("/logout", ctrl.logout);
authRouter.get("/me", requireAuth, ctrl.me);
