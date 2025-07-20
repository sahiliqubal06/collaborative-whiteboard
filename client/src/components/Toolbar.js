import React from "react";

function Toolbar({
  strokeWidth,
  setStrokeWidth,
  strokeColor,
  setStrokeColor,
  onClearCanvas,
}) {
  const colors = ["#000000", "#FF0000", "#0000FF", "#008000"]; // Black, Red, Blue, Green

  return (
    <div className="flex justify-center items-center px-5 py-2.5 bg-white border-b border-gray-200 shadow-sm gap-5 flex-wrap">
      <div className="flex items-center gap-2.5">
        <label htmlFor="stroke-width" className="font-bold text-gray-700">
          Stroke Width:
        </label>
        <input
          type="range"
          id="stroke-width"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          className="w-24 cursor-grab accent-blue-600"
        />
        <span className="text-sm text-gray-600">{strokeWidth}px</span>
      </div>
      <div className="flex gap-1.5">
        {colors.map((color) => (
          <div
            key={color}
            className={`w-7 h-7 rounded-full cursor-pointer border-2 transition-colors duration-100 ${
              strokeColor === color ? "border-blue-600" : "border-transparent"
            } hover:shadow-md`}
            style={{ backgroundColor: color }}
            onClick={() => setStrokeColor(color)}
            title={color}
          ></div>
        ))}
      </div>
      <div>
        <button
          onClick={onClearCanvas}
          className="bg-red-600 text-white py-2 px-4 rounded-md text-sm cursor-pointer hover:bg-red-700 transition-colors duration-200"
        >
          Clear Canvas
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
