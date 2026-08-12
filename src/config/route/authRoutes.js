import express from "express";

import {
  login,
  getMe,
} from "../controller/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Login
router.post("/login", login);

// Current logged-in user
router.get("/me", authMiddleware, getMe);

export default router;