

// export default router;

import express from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import User from "../models/user.js";
import StudentProfile from "../models/StudentProfile.js";
import CounsellorProfile from "../models/counsellor-profile.js";
import Service from "../models/Service.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
import SibApiV3Sdk from "sib-api-v3-sdk";
import { generateEmbedding } from "../utils/embedding.js";

dotenv.config();
const router = express.Router();

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "svbvm4kd";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "649368999834735";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "8ujOA-7k9_czlIQL0dxShtbOxPY";

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

/* ---------- UPLOAD AVATAR TO CLOUDINARY ---------- */
router.post("/upload-avatar", async (req, res) => {
  try {
    const { image, userId } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

    const formData = new URLSearchParams();
    formData.append("file", image);
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const cloudData = await cloudRes.json();

    if (!cloudRes.ok || !cloudData.secure_url) {
      console.error("Cloudinary Error:", cloudData);
      return res.status(500).json({ error: cloudData.error?.message || "Cloudinary upload failed" });
    }

    const imageUrl = cloudData.secure_url;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      await StudentProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $set: { avatar: imageUrl, profilePicture: imageUrl } },
        { upsert: true, new: true }
      );
      await User.findByIdAndUpdate(userId, { avatar: imageUrl, profilePicture: imageUrl });
    }

    res.json({ url: imageUrl, message: "Avatar uploaded to Cloudinary successfully" });
  } catch (error) {
    console.error("Upload avatar server error:", error);
    res.status(500).json({ error: "Failed to upload avatar" });
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

/* ---------- UPDATE STUDENT PROFILE ---------- */
router.put("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, ...profileData } = req.body;

    if (name && mongoose.Types.ObjectId.isValid(userId)) {
      await User.findByIdAndUpdate(userId, { name });
    }

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: profileData },
      { new: true, upsert: true }
    );

    res.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/* ---------- GET COUNSELLOR PROFILE ---------- */
router.get("/counsellor-profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await CounsellorProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate("userId", "name email avatar profilePicture")
      .lean();

    if (!profile)
      return res
        .status(404)
        .json({ message: "Counsellor profile not found" });

    const user = profile.userId;
    res.json({
      ...profile,
      userId: user?._id || profile.userId,
      fullName: user?.name || "Counsellor",
      avatar: user?.avatar || user?.profilePicture || "",
    });
  } catch (error) {
    console.error("Error fetching counsellor profile:", error);
    res.status(500).json({ error: "Failed to fetch counsellor profile" });
  }
});

/* ---------- GET ALL COUNSELLORS ---------- */
router.get("/counsellors/all", async (req, res) => {
  try {
    const profiles = await CounsellorProfile.find({ profileCompleted: true })
      .populate("userId", "name email avatar profilePicture")
      .lean();

    const counsellorUserIds = profiles
      .map((profile) => profile.userId?._id)
      .filter(Boolean);

    const services = counsellorUserIds.length
      ? await Service.find({
          counsellorId: { $in: counsellorUserIds },
          status: true,
        })
          .sort({ price: 1 })
          .lean()
      : [];

    const servicesByCounsellor = services.reduce((acc, service) => {
      const key = String(service.counsellorId);
      if (!acc[key]) acc[key] = [];
      acc[key].push(service);
      return acc;
    }, {});

    const counsellors = profiles.map((profile) => {
      const user = profile.userId;
      const userId = user?._id || profile.userId;
      const counsellorServices = servicesByCounsellor[String(userId)] || [];
      const primaryService = counsellorServices[0] || null;

      return {
        ...profile,
        userId,
        fullName: user?.name || "Counsellor",
        email: user?.email || "",
        avatar: user?.avatar || user?.profilePicture || "",
        services: counsellorServices,
        consultationFee: primaryService?.price ?? null,
        sessionDuration: primaryService?.duration ?? null,
      };
    });

    res.json(counsellors);
  } catch (error) {
    console.error("Error fetching counsellors:", error);
    res.status(500).json({ error: "Failed to fetch counsellors" });
  }
});

export default router;
