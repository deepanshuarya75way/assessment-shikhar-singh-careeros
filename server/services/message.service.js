import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/user.js";
import StudentProfile from "../models/StudentProfile.js";
import CounsellorProfile from "../models/counsellor-profile.js";

const { isValidObjectId } = mongoose;

/**
 * Only student <-> counsellor conversations are allowed.
 * Throws a descriptive error (with .status) if the pair is invalid.
 */
export async function assertValidPair(userAId, userBId) {
  if (!isValidObjectId(userAId) || !isValidObjectId(userBId)) {
    const err = new Error("Invalid user id");
    err.status = 400;
    throw err;
  }
  if (String(userAId) === String(userBId)) {
    const err = new Error("Cannot message yourself");
    err.status = 400;
    throw err;
  }

  const [userA, userB] = await Promise.all([
    User.findById(userAId).select("role name"),
    User.findById(userBId).select("role name"),
  ]);

  if (!userA || !userB) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const roles = [userA.role, userB.role].sort();
  const validPair = roles[0] === "counselor" && roles[1] === "student";

  if (!validPair) {
    const err = new Error("Conversations are only allowed between a student and a counsellor");
    err.status = 403;
    throw err;
  }

  return { userA, userB };
}

/**
 * Resolve display info (name, role, role-specific context) for a user.
 * Keeps Message documents free of duplicated user data.
 */
export async function getDisplayInfo(userId) {
  const user = await User.findById(userId).select("name role");
  if (!user) return null;

  const initials = (user.name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const base = { userId: String(user._id), name: user.name, role: user.role, initials };

  if (user.role === "counselor") {
    const profile = await CounsellorProfile.findOne({ userId }).select("specialization expertise");
    return { ...base, specialization: profile?.specialization || null, expertise: profile?.expertise || [] };
  }

  if (user.role === "student") {
    const profile = await StudentProfile.findOne({ userId }).select("grade stream");
    return { ...base, grade: profile?.grade || null, stream: profile?.stream || null };
  }

  return base;
}

export async function createMessage({ senderId, receiverId, content }) {
  const trimmed = (content || "").trim();
  if (!trimmed) {
    const err = new Error("Message content cannot be empty");
    err.status = 400;
    throw err;
  }
  if (trimmed.length > 5000) {
    const err = new Error("Message is too long");
    err.status = 400;
    throw err;
  }

  await assertValidPair(senderId, receiverId);

  return Message.create({ senderId, receiverId, content: trimmed });
}

export async function getConversation(userId, otherUserId, { limit = 50, before } = {}) {
  await assertValidPair(userId, otherUserId);

  const query = {
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  };
  if (before) query.createdAt = { $lt: new Date(before) };

  const messages = await Message.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  return messages.reverse();
}

export async function getConversationsForUser(userId) {
  if (!isValidObjectId(userId)) {
    const err = new Error("Invalid user id");
    err.status = 400;
    throw err;
  }

  const uid = new mongoose.Types.ObjectId(userId);

  const results = await Message.aggregate([
    { $match: { $or: [{ senderId: uid }, { receiverId: uid }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ["$senderId", uid] }, "$receiverId", "$senderId"] },
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$receiverId", uid] }, { $eq: ["$read", false] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  const conversations = await Promise.all(
    results.map(async (r) => {
      const otherUser = await getDisplayInfo(r._id);
      if (!otherUser) return null;
      return {
        otherUser,
        lastMessage: {
          content: r.lastMessage.content,
          createdAt: r.lastMessage.createdAt,
          senderId: String(r.lastMessage.senderId),
        },
        unreadCount: r.unreadCount,
      };
    })
  );

  return conversations.filter(Boolean);
}

export async function markConversationRead(userId, otherUserId) {
  await assertValidPair(userId, otherUserId);

  return Message.updateMany(
    { senderId: otherUserId, receiverId: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
}