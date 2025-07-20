import express from "express";
import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import { Server as socketIo } from "socket.io";
import cors from "cors";
import router from "./routes/roomRoutes.js";
import setupSocketHandlers from "./socket/socketHandlers.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.use("/api/rooms", router);
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
