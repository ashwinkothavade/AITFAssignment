import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import apiRoutes from "./routes/api.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
// Middleware
app.use(cors({
  origin: [/\.vercel\.app$/, 'http://localhost:3000'],
  credentials: false
}));
app.use(express.json());

// API routes
app.use("/api", apiRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
