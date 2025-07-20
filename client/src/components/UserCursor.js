import React from "react";

function UserCursors({ cursors, currentUserId }) {
  return (
    <div className="user-cursors-container">
      {/* Defined in index.css */}
      {Object.entries(cursors).map(
        ([userId, cursor]) =>
          userId !== currentUserId && (
            <div
              key={userId}
              className="user-cursor"
              style={{
                left: cursor.x,
                top: cursor.y,
                borderBottomColor: cursor.color,
              }}
            >
              <span
                className="cursor-name"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.name || `User ${userId.substring(0, 4)}`}
              </span>
            </div>
          )
      )}
    </div>
  );
}

export default UserCursors;
