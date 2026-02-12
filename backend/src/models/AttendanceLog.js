import mongoose from "mongoose";

const attendanceLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date },
    duration: { type: Number },
    sessions: [
      {
        checkIn: { type: Date, required: true },
        checkOut: { type: Date },
        duration: { type: Number },
      },
    ],
  },
  { timestamps: true },
);

attendanceLogSchema.index({ user: 1, checkIn: -1 });
attendanceLogSchema.index({ user: 1, checkOut: 1 });
attendanceLogSchema.index({ user: 1, date: -1 });

const AttendanceLog = mongoose.model("AttendanceLog", attendanceLogSchema);

export default AttendanceLog;
