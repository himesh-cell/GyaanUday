const express = require("express");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Notification = require("../models/Notification");
const { protect } = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const router = express.Router();

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.domain) filter.domain = req.query.domain;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: "i" };
    if (req.query.user) filter.user = req.query.user;

    let sort = { createdAt: -1 };
    if (req.query.sortBy === "likes") sort = { likes: -1, createdAt: -1 };
    if (req.query.sortBy === "views") sort = { views: -1, createdAt: -1 };
    if (req.query.sortBy === "popularity") sort = { likes: -1, views: -1, createdAt: -1 };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate("user", "name email role")
        .populate("comments.user", "name")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Project.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items: projects,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project id" });
    }

    const project = await Project.findById(req.params.id)
      .populate("user", "name email role")
      .populate("comments.user", "name");
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    project.views += 1;
    await project.save();

    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/",
  protect,
  upload.array("files"),
  async (req, res, next) => {
    try {
      const { title, description, tags, domain, githubLink, deployLink } = req.body;

      // Manual Validation
      if (!title || title.trim().length < 3) {
        return res.status(400).json({ success: false, message: "Title must be at least 3 characters" });
      }
      if (!description || description.trim().length < 10) {
        return res.status(400).json({ success: false, message: "Description must be at least 10 characters" });
      }
      if (!domain) {
        return res.status(400).json({ success: false, message: "Domain is required" });
      }

      const difficulty = req.body.difficulty || "Medium";
      const baseTags = parseTags(tags);

      let fileUrl = "";
      if (req.files && req.files.length > 0) {
        // Store relative path for flexibility across domains
        fileUrl = `/uploads/${req.files[0].filename}`;
      }

      const project = await Project.create({
        title,
        description,
        tags: baseTags,
        domain,
        difficulty,
        githubLink: githubLink || "",
        deployLink: deployLink || "",
        fileUrl: fileUrl,
        user: req.user._id,
      });

      return res.status(201).json({ success: true, data: project });
    } catch (error) {
      return next(error);
    }
  }
);

router.put("/:id", protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project id" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (project.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const allowed = ["title", "description", "tags", "domain", "difficulty", "githubLink", "deployLink", "fileUrl"];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        project[key] = key === "tags" ? parseTags(req.body.tags) : req.body[key];
      }
    });

    await project.save();
    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project id" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (project.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await project.deleteOne();
    return res.status(200).json({ success: true, data: { message: "Project deleted" } });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/like", protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project id" });
    }
    const project = await Project.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/upvote", protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project id" });
    }
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const userId = req.user._id;

    // Remove from downvotes if exists
    project.downvotes = project.downvotes.filter((id) => id.toString() !== userId.toString());

    // Toggle upvote
    const hasUpvoted = project.upvotes.find((id) => id.toString() === userId.toString());
    if (hasUpvoted) {
      project.upvotes = project.upvotes.filter((id) => id.toString() !== userId.toString());
    } else {
      project.upvotes.push(userId);
      // Dispatch notification
      if (project.user.toString() !== userId.toString()) {
        await Notification.create({
          recipient: project.user,
          sender: userId,
          type: "like",
          project: project._id
        });
      }
    }

    await project.save();
    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/downvote", protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project id" });
    }
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const userId = req.user._id;

    // Remove from upvotes if exists
    project.upvotes = project.upvotes.filter((id) => id.toString() !== userId.toString());

    // Toggle downvote
    const hasDownvoted = project.downvotes.find((id) => id.toString() === userId.toString());
    if (hasDownvoted) {
      project.downvotes = project.downvotes.filter((id) => id.toString() !== userId.toString());
    } else {
      project.downvotes.push(userId);
    }

    await project.save();
    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/comment", protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project id" });
    }
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    project.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await project.save();

    // Dispatch notification
    if (project.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: project.user,
        sender: req.user._id,
        type: "comment",
        project: project._id
      });
    }

    // Populate user before returning so frontend can show name immediately
    await project.populate("comments.user", "name");

    return res.status(201).json({ success: true, data: project });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id/comment/:commentId", protect, async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete comments" });
    }

    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.commentId)) {
      return res.status(400).json({ success: false, message: "Invalid IDs" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    // Filter out the comment to be deleted
    project.comments = project.comments.filter(
      (comment) => comment._id.toString() !== req.params.commentId.toString()
    );

    await project.save();
    return res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
