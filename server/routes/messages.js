import express from "express";
import mongoose from "mongoose";
import * as messageService from "../services/message.service.js";

const router = express.Router();
const { isValidObjectId } = mongoose;

// NOTE: this project has no server-verified identity anywhere yet (see
// users.js / dashboards, which all trust a client-supplied userId). These
// routes follow that same existing pattern for consistency. If real auth
// is added later, swap req.params.userId for the verified identity.

router.get("/conversations/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) return res.status(400).json({ error: "Invalid user id" });
  try {
    res.json(await messageService.getConversationsForUser(userId));
  } catch (err) {
    console.error("GET conversations error:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to fetch conversations" });
  }
});

router.get("/:userId/:otherUserId", async (req, res) => {
  const { userId, otherUserId } = req.params;
  const { before, limit } = req.query;
  if (!isValidObjectId(userId) || !isValidObjectId(otherUserId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  try {
    const messages = await messageService.getConversation(userId, otherUserId, {
      before,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(messages);
  } catch (err) {
    console.error("GET conversation error:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to fetch conversation" });
  }
});

router.patch("/:userId/:otherUserId/read", async (req, res) => {
  const { userId, otherUserId } = req.params;
  if (!isValidObjectId(userId) || !isValidObjectId(otherUserId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  try {
    const result = await messageService.markConversationRead(userId, otherUserId);
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error("PATCH read error:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to mark as read" });
  }
});

export default router;