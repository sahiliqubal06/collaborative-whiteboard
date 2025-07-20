import mongoose from "mongoose";

// Schema for individual drawing commands
const DrawingCommandSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["stroke", "clear"],
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Main Room schema
const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  
    // Array to store drawing commands
  drawingData: [DrawingCommandSchema],
});

const Room = mongoose.model("Room", RoomSchema);
export default Room;
