import User from "../models/User.js";
import AttendanceLog from "../models/AttendanceLog.js";

export const getEmployees = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role customRole isActive createdAt")
      .populate("customRole", "name key")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role customRole isActive createdAt")
      .populate("customRole", "name key")
      .sort({ createdAt: -1 });
    const logsByUser = await AttendanceLog.find({
      user: { $in: users.map((u) => u._id) },
    }).sort({ checkIn: -1 });
    const logsMap = logsByUser.reduce((acc, log) => {
      const key = log.user.toString();
      acc[key] = acc[key] || [];
      acc[key].push(log);
      return acc;
    }, {});
    res.json(
      users.map((user) => ({
        ...user.toObject(),
        attendanceLogs: logsMap[user._id.toString()] || [],
      })),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
};
