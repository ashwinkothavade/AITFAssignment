import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  sessionName: { type: String, default: "New Chat" },
  role: { type: String, enum: ["user", "ai"], required: true },
  text: { type: String, required: true },
  lang: { type: String, default: "en-US" },
  theme: { type: String, default: "travel" },
  city: { type: String },
  weather: { type: Object },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// Add text index for search functionality
ChatSchema.index({ text: 'text' });
ChatSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
