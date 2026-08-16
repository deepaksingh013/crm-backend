import express from "express";

import {
  login,
  getMe,
  logout
} from "../controller/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Login
router.post("/login", login);

// Current logged-in user
router.get("/me", authMiddleware, getMe);
router.post(
  "/logout",
  authMiddleware,
  (req, res, next) => {
    console.log("🔥 LOGOUT ROUTE HIT");
    next();
  },
  logout
);

export default router;