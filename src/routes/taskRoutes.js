const express = require("express");
const { body, query } = require("express-validator");
const taskController = require("../controllers/taskController");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("dueDate")
      .notEmpty()
      .withMessage("Due date is required")
      .isISO8601()
      .toDate(),
  ],
  taskController.createTask,
);
router.get(
  "/",
  [
    query("status").optional(),
    query("search").optional(),
    query("sortBy").optional(),
    query("teamId").optional(),
  ],
  taskController.getTasks,
);
router.get("/assigned", taskController.getAssignedTasks);
router.get("/:id", taskController.getTaskById);
router.put(
  "/:id",
  [body("title").optional().notEmpty().withMessage("Title cannot be empty")],
  taskController.updateTask,
);
router.patch("/:id/complete", taskController.completeTask);
router.post(
  "/:id/assign",
  [body("userId").notEmpty().withMessage("userId is required")],
  taskController.assignTaskToUser,
);
router.delete("/:id", taskController.deleteTask);
router.post(
  "/:id/comments",
  [body("body").notEmpty().withMessage("Comment body is required")],
  taskController.addComment,
);
router.post("/:id/attachments", taskController.uploadAttachment);

module.exports = router;
