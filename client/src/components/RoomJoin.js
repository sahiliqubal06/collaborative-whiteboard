import React, { useState } from "react";

function RoomJoin({ onJoinRoom }) {
  const [roomCode, setRoomCode] = useState("");
  const [message, setMessage] = useState("");

  const handleRoomCodeChange = (e) => {
    setRoomCode(e.target.value.toUpperCase().slice(0, 8));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Joining...");
    try {
      const response = await fetch("http://localhost:5000/api/rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: roomCode.trim() || undefined }),
      });

      const data = await response.json();
      if (response.ok) {
        onJoinRoom(data.roomId);
      } else {
        setMessage(data.message || "Failed to join room.");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans text-center">
      <h2 className="text-3xl text-gray-800 mb-5">
        Join or Create a Whiteboard Room
      </h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg flex flex-col gap-4 w-80"
      >
        <input
          type="text"
          value={roomCode}
          onChange={handleRoomCodeChange}
          placeholder="Enter Room Code (e.g., ABCDEF)"
          maxLength="8"
          className="p-3 border border-gray-300 rounded-md text-base text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-3 px-5 rounded-md text-base cursor-pointer hover:bg-blue-700 transition-colors duration-200"
        >
          Go to Whiteboard
        </button>
      </form>
      {message && <p className="mt-4 text-red-600">{message}</p>}
      <p className="mt-2 text-gray-600 text-sm">
        Leave blank to create a new room.
      </p>
    </div>
  );
}

export default RoomJoin;
