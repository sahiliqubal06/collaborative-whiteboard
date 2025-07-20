import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import DrawingCanvas from "./DrawingCanvas";
import Toolbar from "./Toolbar";
import UserCursors from "./UserCursor";

const SOCKET_SERVER_URL = "http://localhost:5000";

function Whiteboard({ roomId, userId, userName }) {
  const [socket, setSocket] = useState(null);
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [remoteCursors, setRemoteCursors] = useState({});
  const [userCount, setUserCount] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      newSocket.emit("join-room", roomId, userId, userName);
    });

    newSocket.on("load-drawing-data", (data) => {
      if (canvasRef.current) {
        canvasRef.current.redraw(data);
      }
    });

    newSocket.on("cursor-move", (data) => {
      setRemoteCursors((prevCursors) => ({
        ...prevCursors,
        [data.userId]: {
          x: data.x,
          y: data.y,
          color: data.color,
          name: data.userName,
        },
      }));
    });

    newSocket.on("user-count-update", (count) => {
      setUserCount(count);
    });

    newSocket.on("draw-start", (data) => {
      if (canvasRef.current) {
        canvasRef.current.handleRemoteDrawStart(data.drawingCommand);
      }
    });

    newSocket.on("draw-move", (data) => {
      if (canvasRef.current) {
        canvasRef.current.handleRemoteDrawMove(data.drawingCommand);
      }
    });

    newSocket.on("draw-end", (data) => {
      if (canvasRef.current) {
        canvasRef.current.handleRemoteDrawEnd(data.drawingCommand);
      }
    });

    newSocket.on("clear-canvas", () => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    });

    newSocket.on("user-left", (leftUserId) => {
      setRemoteCursors((prevCursors) => {
        const newCursors = { ...prevCursors };
        delete newCursors[leftUserId];
        return newCursors;
      });
    });

    return () => {
      newSocket.emit("leave-room", roomId);
      newSocket.disconnect();
    };
  }, [roomId, userId, userName]);

  const handleLocalDrawStart = (drawingCommand) => {
    if (socket) {
      socket.emit("draw-start", { roomId, userId, drawingCommand });
    }
  };

  const handleLocalDrawMove = (drawingCommand) => {
    if (socket) {
      socket.emit("draw-move", { roomId, userId, drawingCommand });
    }
  };

  const handleLocalDrawEnd = (drawingCommand) => {
    if (socket) {
      socket.emit("draw-end", { roomId, userId, drawingCommand });
    }
  };

  const handleClearCanvas = () => {
    if (socket) {
      socket.emit("clear-canvas", roomId);
    }
  };

  const throttleRef = useRef(null);
  const handleMouseMove = (e) => {
    if (!e.currentTarget || !socket) {
      return;
    }

    if (throttleRef.current) return;

    throttleRef.current = setTimeout(() => {
      if (!e.currentTarget) {
        throttleRef.current = null;
        return;
      }

      const canvasRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      socket.emit("cursor-move", {
        roomId,
        userId,
        x,
        y,
        userName,
        color: strokeColor,
      });
      throttleRef.current = null;
    }, 1000 / 60); // Roughly 60 FPS
  };

  return (
    <div
      className="flex flex-col h-screen font-sans bg-gray-100"
      onMouseMove={handleMouseMove}
    >
      <div className="flex justify-between items-center px-5 py-2.5 bg-white border-b border-gray-200 shadow-sm">
        <h2 className="text-xl text-gray-800 m-0">
          Room: <span className="font-semibold">{roomId}</span>
        </h2>
        <div className="text-sm text-gray-600">
          <span className="font-bold text-blue-600">You: {userName}</span> |
          <span className="font-bold"> Users: {userCount}</span>
        </div>
      </div>
      <Toolbar
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        onClearCanvas={handleClearCanvas}
      />
      {/* The `canvas-wrapper` class is defined in index.css as a custom component */}
      <div className="canvas-wrapper">
        <DrawingCanvas
          ref={canvasRef}
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          onLocalDrawStart={handleLocalDrawStart}
          onLocalDrawMove={handleLocalDrawMove}
          onLocalDrawEnd={handleLocalDrawEnd}
        />
        <UserCursors cursors={remoteCursors} currentUserId={userId} />
      </div>
    </div>
  );
}

export default Whiteboard;
