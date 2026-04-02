import mongoose from "mongoose";

const safetyReportSchema = new mongoose.Schema(
  {
    place: { type: String, required: true, trim: true },
    zone: { type: String, required: true, trim: true },
    timeSlot: { type: String, required: true, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    peopleFrequency: { type: Number, required: true, min: 0, max: 10 },
    barAvailability: { type: Number, required: true, min: 0, max: 10 },
    policeStationAvailability: { type: Number, required: true, min: 0, max: 10 },
    policeFrequency: { type: Number, required: true, min: 0, max: 10 },
    reporterComment: { type: String, trim: true, default: "" },
    reportedBy: { type: String, trim: true, default: "Anonymous" }
  },
  { timestamps: true }
);

export default mongoose.model("SafetyReport", safetyReportSchema);
