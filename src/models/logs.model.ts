import mongoose, { Schema, Document } from "mongoose";

export interface IBidLogs {
  taskId: string;
  title: string;
  message: string;
  type: "skipped" | "warning" | "error";
  marketplace: "opensea" | "magiceden" | "blur";
  createdAt: Date;
  updatedAt: Date;
}

const bidLogsSchema = new mongoose.Schema<IBidLogs>(
  {
    taskId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    marketplace: { type: String, required: true },
  },
  { timestamps: true }
);

bidLogsSchema.index({ taskId: 1 });

const BidLogs =
  mongoose.models.BidLogs || mongoose.model<IBidLogs>("BidLogs", bidLogsSchema);
export default BidLogs;
