import Room from "../models/Room.js";

// Function to handle all socket-related events
const setupSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    // Log new user connection
    console.log(`User connected: ${socket.id}`);

    // When a user joins a room
    socket.on("join-room", async (roomId, userId, userName) => {
      socket.join(roomId);
      console.log(`${userName} (${userId}) joined room: ${roomId}`);

      try {
        const room = await Room.findOne({ roomId });
        // Load previous drawing data for the room if it exists
        if (room && room.drawingData && room.drawingData.length > 0) {
          socket.emit("load-drawing-data", room.drawingData);
        }
      } catch (error) {
        console.error(`Error loading drawing data for room ${roomId}:`, error); // Removed space before "Error"
      }

      // Broadcast user count update
      const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
      const numUsers = clientsInRoom ? clientsInRoom.size : 1;
      io.to(roomId).emit("user-count-update", numUsers);

      // Notify other users that someone joined
      socket.to(roomId).emit("user-joined", { userId, userName });
    });

    // When a user's cursor moves broadcast to others
    socket.on("cursor-move", (data) => {
      socket.to(data.roomId).emit("cursor-move", {
        userId: data.userId,
        x: data.x,
        y: data.y,
        color: data.color,
      });
    });

    // When drawing starts, save the initial stroke and broadcast
    socket.on("draw-start", async (data) => {
      try {
        const room = await Room.findOne({ roomId: data.roomId });
        if (room) {
          room.drawingData.push({
            type: "stroke",
            data: data.drawingCommand,
            timestamp: Date.now(),
          });
          await room.save();
        }
      } catch (error) {
        console.error("Error saving draw-start:", error);
      }

      socket.to(data.roomId).emit("draw-start", data);
    });

    // When drawing is moving, update last stroke
    socket.on("draw-move", async (data) => {
      try {
        const room = await Room.findOne({ roomId: data.roomId });
        if (room && room.drawingData.length > 0) {
          const lastCommand = room.drawingData[room.drawingData.length - 1];

          if (
            lastCommand.type === "stroke" &&
            lastCommand.data.userId === data.userId
          ) {
            if (!lastCommand.data.points) {
              lastCommand.data.points = [];
            }

            lastCommand.data.points.push(
              data.drawingCommand.points.at(-1) // Gets last point
            );

            await room.save();
          }
        }
      } catch (error) {
        console.error("Error saving draw-move:", error);
      }

      socket.to(data.roomId).emit("draw-move", data);
    });

    // When drawing ends, broadcast to others
    socket.on("draw-end", (data) => {
      socket.to(data.roomId).emit("draw-end", data);
    });

    // When canvas is cleared, update DB and notify all in room
    socket.on("clear-canvas", async (roomId) => {
      try {
        const room = await Room.findOne({ roomId });
        if (room) {
          room.drawingData = [
            { type: "clear", data: {}, timestamp: Date.now() },
          ];
          await room.save();
        }
      } catch (error) {
        console.error("Error saving clear-canvas:", error);
      }

      io.to(roomId).emit("clear-canvas");
    });

    // When a user leaves a room
    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room: ${roomId}`);

      const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
      const numUsers = clientsInRoom ? clientsInRoom.size : 0;

      io.to(roomId).emit("user-count-update", numUsers);
      socket.to(roomId).emit("user-left", socket.id);
    });

    // When a user disconnects, update other users
    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);

      rooms.forEach((roomId) => {
        const clients = io.sockets.adapter.rooms.get(roomId);
        const numUsers = clients ? clients.size - 1 : 0;

        io.to(roomId).emit("user-count-update", numUsers);
        socket.to(roomId).emit("user-left", socket.id);
      });

      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

export default setupSocketHandlers;
