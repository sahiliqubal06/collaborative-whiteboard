import React, { useState, useEffect } from "react";
import RoomJoin from "./components/RoomJoin";
import Whiteboard from "./components/Whiteboard";
import "./index.css"; // Import the global Tailwind CSS file

function App() {
  const [roomId, setRoomId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let currentUserId = localStorage.getItem("whiteboard-userId");
    if (!currentUserId) {
      currentUserId =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      localStorage.setItem("whiteboard-userId", currentUserId);
    }
    setUserId(currentUserId);

    const names = [
      "Alpha",
      "Beta",
      "Gamma",
      "Delta",
      "Epsilon",
      "Zeta",
      "Eta",
      "Theta",
    ];
    let currentUserName = localStorage.getItem("whiteboard-userName");
    if (!currentUserName) {
      currentUserName =
        names[Math.floor(Math.random() * names.length)] +
        Math.floor(Math.random() * 100);
      localStorage.setItem("whiteboard-userName", currentUserName);
    }
    setUserName(currentUserName);
  }, []);

  const handleJoinRoom = (id) => {
    setRoomId(id);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased flex flex-col items-center justify-center">
      {roomId ? (
        <Whiteboard roomId={roomId} userId={userId} userName={userName} />
      ) : (
        <RoomJoin onJoinRoom={handleJoinRoom} />
      )}
    </div>
  );
}

export default App;
