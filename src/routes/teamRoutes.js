const express = require("express");
const { body } = require("express-validator");
const teamController = require("../controllers/teamController");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.use(authenticate);
router.post(
  "/",
  [body("name").notEmpty().withMessage("Team name is required")],
  teamController.createTeam,
);
router.get("/", teamController.getTeams);
router.post(
  "/:id/invite",
  [body("userId").notEmpty().withMessage("userId is required")],
  teamController.inviteMember,
);
router.post("/:id/join", teamController.joinTeam);

module.exports = router;
