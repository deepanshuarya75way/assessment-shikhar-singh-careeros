

// export default router;

import express from "express";
import mongoose from "mongoose";
import User from "../models/user.js";
import StudentProfile from "../models/StudentProfile.js";
import CounsellorProfile from "../models/counsellor-profile.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
import SibApiV3Sdk from "sib-api-v3-sdk";
import { generateEmbedding } from "../utils/embedding.js";

dotenv.config();
const router = express.Router();

/* -------------------- BREVO API SETUP (NO SMTP) -------------------- */
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const transactionalEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();



function createStudentPrompt(profile) {
  return `
Grade: ${profile.grade}
Stream: ${profile.stream}
Interests: ${profile.interests.join(", ")}
Strong Subjects: ${profile.strongSubjects.join(", ")}
Career Goals: ${profile.careerGoals || "Not specified"}
Hobbies: ${profile.hobbies.join(", ")}
Age: ${profile.age}
Location: ${profile.location}
Tenth Percent: ${profile.tenthPercent}
Twelfth Percent: ${profile.twelfthPercent || "Not specified"}
Budget Range: ${profile.budgetRange}
Study Mode: ${profile.studyMode}
Preferred Study Location: ${profile.preferredStudyLocation}
Open to Scholarship or Loan: ${profile.openToScholarshipOrLoan}
Competitive Exams: ${profile.competitiveExams.join(", ")}
`;
}

/* -------------------- SIGNUP + OTP -------------------- */
router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    const newUser = new User({
      name,
      email,
      password,
      role,
      verified: false,
      otp,
      otpExpires,
    });

    await newUser.save();

    /* -------- SEND OTP VIA BREVO HTTP API (RENDER SAFE) -------- */
    await transactionalEmailApi.sendTransacEmail({
      sender: {
        name: "CareerOS",
        email: "sshikhar442@gmail.com", // VERIFIED SENDER IN BREVO
      },
      to: [{ email }],
      subject: "Your OTP Verification Code",
      htmlContent: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This code is valid for 5 minutes.</p>
      `,
    });

    res.status(201).json({
      message: "User created. OTP sent to email.",
      userId: newUser._id,
    });
  } catch (err) {
    console.error("SIGNUP ERROR FULL:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* -------------------- VERIFY OTP -------------------- */
router.post("/verify-otp", async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "User not found" });

    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date(user.otpExpires).getTime() < Date.now()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    user.verified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: "Email verified successfully", user });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------------------- SIGNIN -------------------- */
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    if (!user.verified) {
      return res
        .status(400)
        .json({ error: "Email not verified. Please verify your email first." });
    }

    if (user.password !== password) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    res.json({ message: "Signin successful", user });
  } catch (err) {
    console.error("SIGNIN ERROR:", err);
    res.status(500).json({ error: "Signin failed" });
  }
});

router.post("/complete-profile", async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;

    const newProfile = new StudentProfile({ userId, ...profileData });

    const promptText = createStudentPrompt(newProfile);

    const embeddingVector = await generateEmbedding(promptText);

    if (!embeddingVector) {
      return res.status(500).json({
        error: "Embedding generation failed",
      });
    }

    newProfile.embedding = embeddingVector;

    await newProfile.save();

    return res.status(201).json({
      message: "Profile completed",
      profile: newProfile,
    });
  } catch (error) {
    console.error("PROFILE ERROR:", error);

    return res.status(500).json({
      error: "Failed to save profile",
    });
  }
});

/* ---------- COMPLETE COUNSELLOR PROFILE ---------- */
router.post("/complete-counsellor-profile", async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    const newProfile = new CounsellorProfile({ userId, ...profileData });
    await newProfile.save();
    return res.status(201).json({ message: "Counsellor profile completed", profile: newProfile });
  } catch (error) {
    console.error("Counsellor profile completion error:", error);
    res.status(500).json({ error: "Failed to save counsellor profile" });
  }
});

/* ---------- GET STUDENT PROFILE ---------- */
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await StudentProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/* ---------- GET COUNSELLOR PROFILE ---------- */
router.get("/counsellor-profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await CounsellorProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!profile)
      return res
        .status(404)
        .json({ message: "Counsellor profile not found" });
    res.json(profile);
  } catch (error) {
    console.error("Error fetching counsellor profile:", error);
    res.status(500).json({ error: "Failed to fetch counsellor profile" });
  }
});

/* ---------- GET ALL COUNSELLORS ---------- */
router.get("/counsellors/all", async (req, res) => {
  try {
    const counsellors = await CounsellorProfile.find({});
    res.json(counsellors);
  } catch (error) {
    console.error("Error fetching counsellors:", error);
    res.status(500).json({ error: "Failed to fetch counsellors" });
  }
});

export default router;
