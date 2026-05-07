const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const Project = require("../models/Project");
const User = require("../models/User");
const Notification = require("../models/Notification");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `profile-${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const router = express.Router();

router.get("/dashboard/stats", protect, async (req, res, next) => {
  try {
    const stats = await Project.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          totalLikes: { $sum: "$likes" },
          totalViews: { $sum: "$views" },
        },
      },
    ]);

    const data = stats[0] || { totalProjects: 0, totalLikes: 0, totalViews: 0 };
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

router.get("/users", protect, adminOnly, async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return next(error);
  }
});

router.delete("/users/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Safety check: Don't allow deleting admins
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Cannot delete an administrator account." });
    }

    await user.deleteOne();
    // Also delete user's projects
    await Project.deleteMany({ user: req.params.id });
    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    return next(error);
  }
});

router.get("/public/count", async (req, res, next) => {
  try {
    const count = await User.countDocuments();
    return res.status(200).json({ success: true, count });
  } catch (error) {
    return next(error);
  }
});

router.get("/public/leaderboard", async (req, res, next) => {
  try {
    const leaderboard = await Project.aggregate([
      {
        $group: {
          _id: "$user",
          totalLikes: { $sum: "$likes" },
          upvoteCount: { $sum: { $size: { $ifNull: ["$upvotes", []] } } },
          projectCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          totalScore: { $add: ["$totalLikes", "$upvoteCount"] }
        }
      },
      {
        $sort: { totalScore: -1 }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $unwind: "$userInfo"
      },
      {
        $project: {
          _id: 1,
          totalScore: 1,
          projectCount: 1,
          name: "$userInfo.name",
          email: "$userInfo.email"
        }
      },
      {
        $limit: 10
      }
    ]);
    return res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    return next(error);
  }
});

// Get user's own profile info (including bio, profile picture)
router.get("/users/me", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
});

// Get public profile of any user
router.get("/users/public/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name email bio profilePicture createdAt friends")
      .populate("friends", "name profilePicture");
      
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Optional: Also fetch the number of projects this user has
    const projectCount = await Project.countDocuments({ user: user._id });

    return res.status(200).json({ 
      success: true, 
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        joinedAt: user.createdAt,
        friendsCount: user.friends ? user.friends.length : 0,
        projectCount
      } 
    });
  } catch (error) {
    return next(error);
  }
});

// Update user profile (bio, profile picture)
router.put("/users/me", protect, upload.single("profilePicture"), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.body.bio !== undefined) {
      user.bio = req.body.bio;
    }

    if (req.file) {
      user.profilePicture = `/uploads/${req.file.filename}`;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    return next(error);
  }
});

// FRIEND SYSTEM ROUTES

// Search users
router.get("/users/search", protect, async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(200).json({ success: true, data: [] });

    // Find users matching query (excluding self)
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    }).select("name email profilePicture bio").limit(10);

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return next(error);
  }
});

// Get current user's friends and pending requests
router.get("/users/friends", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friends", "name email profilePicture bio")
      .populate("friendRequests", "name email profilePicture bio");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({
      success: true,
      data: {
        friends: user.friends,
        friendRequests: user.friendRequests
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Send friend request
router.post("/users/friends/request/:id", protect, async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot send friend request to yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    const currentUser = await User.findById(req.user._id);

    // Check for blocks
    if (currentUser.blockedUsers && currentUser.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: "You have blocked this user" });
    }
    if (targetUser.blockedUsers && targetUser.blockedUsers.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot send a friend request to this user" });
    }

    // Check if already friends
    if (currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: "Already friends" });
    }

    // Check if request already sent
    if (targetUser.friendRequests.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: "Friend request already sent" });
    }

    // Check if they already sent US a request (auto-accept basically, but let's just reject the request send for now)
    if (currentUser.friendRequests.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: "This user already sent you a friend request. Accept it instead." });
    }

    targetUser.friendRequests.push(req.user._id);
    await targetUser.save();

    return res.status(200).json({ success: true, message: "Friend request sent" });
  } catch (error) {
    return next(error);
  }
});

// Accept friend request
router.post("/users/friends/accept/:id", protect, async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    if (!currentUser.friendRequests.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: "No friend request found from this user" });
    }

    // Remove from requests, add to friends for current user
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== targetUserId);
    currentUser.friends.push(targetUserId);
    await currentUser.save();

    // Add to friends for target user
    if (!targetUser.friends.includes(req.user._id)) {
      targetUser.friends.push(req.user._id);
      await targetUser.save();
    }

    return res.status(200).json({ success: true, message: "Friend request accepted" });
  } catch (error) {
    return next(error);
  }
});

// Reject friend request
router.post("/users/friends/reject/:id", protect, async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = await User.findById(req.user._id);

    if (!currentUser.friendRequests.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: "No friend request found from this user" });
    }

    // Remove from requests
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== targetUserId);
    await currentUser.save();

    return res.status(200).json({ success: true, message: "Friend request rejected" });
  } catch (error) {
    return next(error);
  }
});

// Remove friend
router.delete("/users/friends/:id", protect, async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: "Not friends with this user" });
    }

    // Remove from both friends lists
    currentUser.friends = currentUser.friends.filter(id => id.toString() !== targetUserId);
    await currentUser.save();

    if (targetUser) {
      targetUser.friends = targetUser.friends.filter(id => id.toString() !== req.user._id.toString());
      await targetUser.save();
    }

    return res.status(200).json({ success: true, message: "Friend removed" });
  } catch (error) {
    return next(error);
  }
});

// Toggle block user
router.post("/users/block/:id", protect, async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot block yourself" });
    }

    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

    const isBlocked = currentUser.blockedUsers && currentUser.blockedUsers.includes(targetUserId);
    
    if (isBlocked) {
      // Unblock
      currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== targetUserId.toString());
    } else {
      // Block
      if (!currentUser.blockedUsers) currentUser.blockedUsers = [];
      currentUser.blockedUsers.push(targetUserId);
      
      // If they are friends, we should ideally remove friendship, but let's just do it here for completeness
      currentUser.friends = currentUser.friends.filter(id => id.toString() !== targetUserId.toString());
      targetUser.friends = targetUser.friends.filter(id => id.toString() !== req.user._id.toString());
      await targetUser.save();
    }

    await currentUser.save();
    return res.status(200).json({ success: true, message: isBlocked ? "User unblocked" : "User blocked" });
  } catch (error) {
    return next(error);
  }
});

// NOTIFICATIONS
router.get("/notifications", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friendRequests", "name profilePicture");
    
    const dbNotifs = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name profilePicture")
      .populate("project", "title")
      .sort({ createdAt: -1 })
      .lean();

    // Map friend requests to notification structure
    const friendReqNotifs = (user.friendRequests || []).map(sender => ({
      _id: `fr_${sender._id}`,
      type: "friend_request",
      sender,
      isRead: false,
      createdAt: new Date() // Just for sorting
    }));

    const allNotifs = [...friendReqNotifs, ...dbNotifs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = friendReqNotifs.length + dbNotifs.filter(n => !n.isRead).length;

    return res.status(200).json({ success: true, data: allNotifs, unreadCount });
  } catch (err) {
    return next(err);
  }
});

router.put("/notifications/read", protect, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
