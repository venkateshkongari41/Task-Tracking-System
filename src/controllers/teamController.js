const { validationResult } = require("express-validator");
const Team = require("../models/Team");
const Task = require("../models/Task");
const User = require("../models/User");

exports.createTeam = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const team = await Team.create({
      name: req.body.name,
      description: req.body.description || "",
      createdBy: req.user.userId,
      members: [req.user.userId],
    });
    const user = await User.findById(req.user.userId);
    if (user && !user.teams.includes(team._id)) {
      user.teams.push(team._id);
      await user.save();
    }
    res.status(201).json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Team creation failed" });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user.userId }).populate(
      "members createdBy",
    );
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load teams" });
  }
};

exports.joinTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.members.includes(req.user.userId)) {
      return res.status(400).json({ message: "Already a member" });
    }

    const invite = team.invites.find(
      (invite) =>
        invite.user.toString() === req.user.userId &&
        invite.status === "pending",
    );
    if (!invite) {
      return res
        .status(403)
        .json({ message: "You must be invited to join this team" });
    }

    invite.status = "accepted";
    team.members.push(req.user.userId);
    await team.save();

    const user = await User.findById(req.user.userId);
    if (user && !user.teams.includes(team._id)) {
      user.teams.push(team._id);
      await user.save();
    }

    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to join team" });
  }
};

exports.inviteMember = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId } = req.body;

  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (
      team.createdBy.toString() !== req.user.userId &&
      !team.members.includes(req.user.userId)
    ) {
      return res.status(403).json({ message: "Only team members can invite" });
    }

    if (team.members.includes(userId)) {
      return res.status(400).json({ message: "User is already a team member" });
    }

    if (
      team.invites.some(
        (invite) =>
          invite.user.toString() === userId && invite.status === "pending",
      )
    ) {
      return res.status(400).json({ message: "Invite already pending" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    team.invites.push({ user: userId, invitedBy: req.user.userId });
    await team.save();
    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to invite member" });
  }
};

exports.assignTaskToUser = async (req, res) => {
  const { userId } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.team) {
      const team = await Team.findById(task.team);
      if (!team.members.includes(userId)) {
        return res
          .status(400)
          .json({ message: "User is not a member of the team" });
      }
    }

    task.assignedTo = userId;
    await task.save();
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Task assignment failed" });
  }
};
