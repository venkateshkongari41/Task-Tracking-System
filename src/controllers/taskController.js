const { validationResult } = require("express-validator");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const User = require("../models/User");
const Team = require("../models/Team");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "..", "uploads");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

exports.uploadAttachment = [
  upload.single("attachment"),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Attachment file is required" });
      }

      const attachment = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        uploadedBy: req.user.userId,
      };

      task.attachments.push(attachment);
      await task.save();
      res.status(201).json(task);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Attachment upload failed" });
    }
  },
];

exports.createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const task = await Task.create({
      ...req.body,
      createdBy: req.user.userId,
    });
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Task creation failed" });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { status, search, sortBy, teamId, assignedTo } = req.query;
    const filter = {
      $or: [{ createdBy: req.user.userId }, { assignedTo: req.user.userId }],
    };

    if (status) {
      if (status === "open") {
        filter.status = { $in: ["todo", "in-progress"] };
      } else if (status === "completed") {
        filter.status = "done";
      } else {
        filter.status = status;
      }
    }
    if (teamId) filter.team = teamId;
    if (assignedTo) {
      filter.assignedTo = assignedTo === "me" ? req.user.userId : assignedTo;
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const sort = {};
    if (sortBy) {
      const [field, order] = sortBy.split(":");
      sort[field] = order === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const tasks = await Task.find(filter)
      .populate("createdBy assignedTo team comments")
      .sort(sort);

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load tasks" });
  }
};

exports.getAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.userId })
      .populate("createdBy assignedTo team comments")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load assigned tasks" });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "createdBy assignedTo team comments",
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load task" });
  }
};

exports.updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      task.createdBy.toString() !== req.user.userId &&
      task.assignedTo?.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Permission denied" });
    }

    Object.assign(task, req.body);
    await task.save();
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Task update failed" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      task.createdBy.toString() !== req.user.userId &&
      task.assignedTo?.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Permission denied" });
    }

    await task.remove();
    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Task deletion failed" });
  }
};

exports.addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comment = await Comment.create({
      task: task._id,
      author: req.user.userId,
      body: req.body.body,
    });
    task.comments.push(comment._id);
    await task.save();
    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Comment creation failed" });
  }
};

exports.assignTaskToUser = async (req, res) => {
  const { userId } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    task.assignedTo = userId;
    await task.save();
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Task assignment failed" });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      task.createdBy.toString() !== req.user.userId &&
      task.assignedTo?.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Permission denied" });
    }

    task.status = "done";
    await task.save();
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Task completion failed" });
  }
};
