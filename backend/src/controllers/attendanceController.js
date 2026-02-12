import User from "../models/User.js";
import AttendanceLog from "../models/AttendanceLog.js";
import { autoClockOutIfNeeded } from "../utils/attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";

export const clockIn = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled" });
    }

    const lastOpen = await AttendanceLog.findOne({
      user: user._id,
      checkOut: { $exists: false },
    }).sort({ checkIn: -1 });

    if (lastOpen) {
      const autoClosed = await autoClockOutIfNeeded(lastOpen);
      if (autoClosed) {
        await lastOpen.save();
      } else {
        return res.status(400).json({ message: "Already clocked in" });
      }
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todayLog = await AttendanceLog.findOne({
      user: user._id,
      $or: [
        { date: { $gte: startOfDay, $lte: endOfDay } },
        { checkIn: { $gte: startOfDay, $lte: endOfDay } },
      ],
    }).sort({ checkIn: -1 });

    const ensureSessions = (log) => {
      if (!Array.isArray(log.sessions) || log.sessions.length === 0) {
        if (log.checkIn) {
          log.sessions = [
            {
              checkIn: log.checkIn,
              checkOut: log.checkOut,
              duration: log.duration,
            },
          ];
        }
      }
    };

    if (todayLog) {
      if (!todayLog.checkOut) {
        return res.status(400).json({ message: "Already clocked in" });
      }

      ensureSessions(todayLog);
      todayLog.sessions.push({ checkIn: now });
      todayLog.checkOut = undefined;
      if (!todayLog.date) todayLog.date = startOfDay;
      await todayLog.save();
    } else {
      await AttendanceLog.create({
        user: user._id,
        date: startOfDay,
        checkIn: now,
        sessions: [{ checkIn: now }],
      });
    }

    const logs = await AttendanceLog.find({ user: user._id }).sort({ checkIn: -1 });
    res.json({ message: "Clocked in", attendanceLogs: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to clock in" });
  }
};

export const clockOut = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todayLog = await AttendanceLog.findOne({
      user: user._id,
      checkOut: { $exists: false },
      $or: [
        { date: { $gte: startOfDay, $lte: endOfDay } },
        { checkIn: { $gte: startOfDay, $lte: endOfDay } },
      ],
    }).sort({ checkIn: -1 });

    if (!todayLog) {
      return res.status(400).json({ message: "No active clock-in" });
    }

    const ensureSessions = (log) => {
      if (!Array.isArray(log.sessions) || log.sessions.length === 0) {
        if (log.checkIn) {
          log.sessions = [
            {
              checkIn: log.checkIn,
              checkOut: log.checkOut,
              duration: log.duration,
            },
          ];
        }
      }
    };

    ensureSessions(todayLog);
    const openSession = [...(todayLog.sessions || [])].reverse().find((s) => !s.checkOut);
    if (!openSession) {
      return res.status(400).json({ message: "No active clock-in" });
    }

    openSession.checkOut = now;
    openSession.duration = Math.max(
      0,
      Math.floor((now - new Date(openSession.checkIn)) / (1000 * 60)),
    );

    const totalMinutes = (todayLog.sessions || []).reduce((sum, session) => {
      if (session.duration) return sum + session.duration;
      if (session.checkIn && session.checkOut) {
        return (
          sum +
          Math.max(
            0,
            Math.floor(
              (new Date(session.checkOut) - new Date(session.checkIn)) / (1000 * 60),
            ),
          )
        );
      }
      return sum;
    }, 0);

    todayLog.duration = totalMinutes;
    todayLog.checkOut = now;
    if (!todayLog.date) todayLog.date = startOfDay;
    await todayLog.save();

    const logs = await AttendanceLog.find({ user: user._id }).sort({ checkIn: -1 });
    res.json({ message: "Clocked out", attendanceLogs: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to clock out" });
  }
};

export const getAttendancePanel = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "superadmin" } })
      .select("name email role createdAt employeeId")
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endToday = new Date(today);
    endToday.setHours(23, 59, 59, 999);

    const leaves = await LeaveRequest.find({
      status: "approved",
      fromDate: { $lte: endToday },
      toDate: { $gte: today },
    }).select("employee halfDay fromDate toDate typeName");

    const leaveMap = leaves.reduce((acc, leave) => {
      const key = leave.employee.toString();
      acc[key] = leave;
      return acc;
    }, {});

    res.json(
      users.map((user) => ({
        ...user.toObject(),
        attendanceLogs: logsMap[user._id.toString()] || [],
        leave: leaveMap[user._id.toString()] || null,
      })),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch attendance panel" });
  }
};
