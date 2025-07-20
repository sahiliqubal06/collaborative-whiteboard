import express from "express";
import Room from "../models/Room.js";
import shortid from "shortid";

const router = express.Router();

// Join or create a room
router.post("/join", async (req, res) => {
  const { roomId: requestedRoomId } = req.body;
  let room;

  try {
    if (requestedRoomId) {
      // Try to find the existing room
      room = await Room.findOne({ roomId: requestedRoomId });
    }

    if (!room) {
      // If no room was requested or it wasn't found, create a new one
      const newRoomId =
        requestedRoomId || shortid.generate().slice(0, 8).toUpperCase();
      room = new Room({ roomId: newRoomId });

      await room.save();
      console.log(` Created new room: ${newRoomId}`);
      return res.status(201).json({
        roomId: newRoomId,
        message: "Room created successfully.",
      });
    } else {
      room.lastActivity = Date.now();
      await room.save();

      return res.status(200).json({
        roomId: room.roomId,
        message: "Joined existing room.",
      });
    }
  } catch (error) {
    console.error("Error in room join/create:", error);
    res
      .status(500)
      .json({ message: "Server error while joining/creating room." });
  }
});

//  Get room info and drawing data
router.get("/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    res.status(200).json({
      roomId: room.roomId,
      drawingData: room.drawingData,
    });
  } catch (error) {
    console.error("Error fetching room data:", error);
    res.status(500).json({ message: "Server error while fetching room data." });
  }
});

export default router;
