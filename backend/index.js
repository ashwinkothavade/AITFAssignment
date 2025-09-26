import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import apiRoutes from "./routes/api.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [/\.vercel\.app$/, 'http://localhost:3000'],
  credentials: false
}));
app.use(express.json());

// API routes
app.use("/api", apiRoutes);

// MongoDB connection, start server ONLY once here
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    // Optionally exit so Render marks deploy failed and shows logs
    process.exit(1);
  });