const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Get unread message count
router.get("/unread", protect, async (req, res, next) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false
    });
    return res.status(200).json({ success: true, count: unreadCount });
  } catch (error) {
    return next(error);
  }
});

// Get conversations (inbox)
router.get("/conversations", protect, async (req, res, next) => {
  try {
    const myId = req.user._id;
    
    // Find all messages where I am sender or receiver, sorted by latest
    const messages = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }]
    })
    .sort({ createdAt: -1 })
    .populate("sender", "name profilePicture")
    .populate("receiver", "name profilePicture")
    .lean();

    // Map by other user
    const convoMap = new Map();
    
    messages.forEach(msg => {
      const isSender = msg.sender._id.toString() === myId.toString();
      const otherUser = isSender ? msg.receiver : msg.sender;
      const otherId = otherUser._id.toString();

      if (!convoMap.has(otherId)) {
        convoMap.set(otherId, {
          otherUser,
          latestMessage: msg.text,
          createdAt: msg.createdAt,
          unreadCount: (!isSender && !msg.isRead) ? 1 : 0
        });
      } else {
        if (!isSender && !msg.isRead) {
          convoMap.get(otherId).unreadCount++;
        }
      }
    });

    const conversations = Array.from(convoMap.values());

    return res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    return next(error);
  }
});

// Get chat history with another user
router.get("/:otherUserId", protect, async (req, res, next) => {
  try {
    const { otherUserId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    // Check if the other user exists
    const otherUser = await User.findById(otherUserId).select("name profilePicture");
    if (!otherUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Mark messages sent to me by this user as read
    await Message.updateMany(
      { sender: otherUserId, receiver: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id }
      ]
    })
    .sort({ createdAt: 1 })
    .lean();

    const currentUser = await User.findById(req.user._id);
    const isFriend = currentUser.friends && currentUser.friends.includes(otherUserId);
    const hasBlocked = currentUser.blockedUsers && currentUser.blockedUsers.includes(otherUserId);
    const isBlockedBy = otherUser.blockedUsers && otherUser.blockedUsers.includes(req.user._id);

    return res.status(200).json({ 
      success: true, 
      data: {
        otherUser,
        messages,
        isFriend: !!isFriend,
        isBlocked: !!(hasBlocked || isBlockedBy),
        hasBlocked: !!hasBlocked
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Send a message
router.post("/:receiverId", protect, async (req, res, next) => {
  try {
    const { receiverId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const sender = await User.findById(req.user._id);
    if (sender.blockedUsers && sender.blockedUsers.includes(receiverId)) {
      return res.status(400).json({ success: false, message: "You have blocked this user" });
    }
    if (receiver.blockedUsers && receiver.blockedUsers.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot message this user" });
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text: text.trim()
    });

    return res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
