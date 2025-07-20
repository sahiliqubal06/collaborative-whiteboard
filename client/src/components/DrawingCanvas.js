import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";

const DrawingCanvas = forwardRef(
  (
    {
      strokeWidth,
      strokeColor,
      onLocalDrawStart,
      onLocalDrawMove,
      onLocalDrawEnd,
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingHistory, setDrawingHistory] = useState([]);
    const [canvasReady, setCanvasReady] = useState(false);
    const remoteDrawingActive = useRef({});

    // Helper to draw a single stroke
    const drawStroke = useCallback((ctx, points, color, width) => {
      if (!ctx || points.length < 1) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      if (points.length === 1) {
        ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      }
    }, []);

    // The redraw function
    const redraw = useCallback(
      (commands) => {
        const context = contextRef.current;
        const canvas = canvasRef.current;
        if (!context || !canvas || !canvasReady) {
          return;
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        commands.forEach((cmd) => {
          if (cmd.type === "stroke") {
            drawStroke(
              context,
              cmd.data.points,
              cmd.data.color,
              cmd.data.width
            );
          } else if (cmd.type === "clear") {
            context.clearRect(0, 0, canvas.width, canvas.height);
          }
        });
      },
      [drawStroke, canvasReady]
    );

    // Initialize canvas and context when the component mounts
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.warn("Canvas ref is null on initial useEffect");
        return;
      }

      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : window.innerWidth * 0.9;
      const height = parent ? parent.clientHeight : window.innerHeight * 0.8;

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        console.error("Failed to get 2D context for canvas!");
        return;
      }

      context.lineCap = "round";
      context.lineJoin = "round";
      contextRef.current = context;
      setCanvasReady(true);

      return () => {
        contextRef.current = null;
        setCanvasReady(false);
      };
    }, []);

    // Effect to redraw history when drawingHistory state changes
    useEffect(() => {
      if (drawingHistory.length > 0 && canvasReady) {
        redraw(drawingHistory);
      }
    }, [drawingHistory, redraw, canvasReady]);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        clearCanvas() {
          const context = contextRef.current;
          const canvas = canvasRef.current;
          if (!context || !canvas || !canvasReady) {
            console.warn("Attempted clearCanvas, but canvas not ready.");
            return;
          }
          context.clearRect(0, 0, canvas.width, canvas.height);
          setDrawingHistory([]);
        },
        redraw: (commands) => {
          if (canvasReady) {
            setDrawingHistory(commands);
          }
        },
        handleRemoteDrawStart(drawingCommand) {
          const context = contextRef.current;
          if (!context || !canvasReady) {
            console.warn("Remote draw start, but canvas not ready.");
            return;
          }
          remoteDrawingActive.current[drawingCommand.userId] = {
            path: [...drawingCommand.points],
            color: drawingCommand.color,
            width: drawingCommand.width,
          };
          drawStroke(
            context,
            drawingCommand.points,
            drawingCommand.color,
            drawingCommand.width
          );
        },
        handleRemoteDrawMove(drawingCommand) {
          const context = contextRef.current;
          const remoteStroke =
            remoteDrawingActive.current[drawingCommand.userId];
          if (
            !remoteStroke ||
            !drawingCommand.points ||
            drawingCommand.points.length === 0 ||
            !context ||
            !canvasReady
          ) {
            return;
          }
          const lastPoint =
            drawingCommand.points[drawingCommand.points.length - 1];
          remoteStroke.path.push(lastPoint);

          if (remoteStroke.path.length >= 2) {
            drawStroke(
              context,
              [remoteStroke.path[remoteStroke.path.length - 2], lastPoint],
              remoteStroke.color,
              remoteStroke.width
            );
          }
        },
        handleRemoteDrawEnd(drawingCommand) {
          const context = contextRef.current;
          const remoteStroke =
            remoteDrawingActive.current[drawingCommand.userId];
          if (!remoteStroke || !context || !canvasReady) {
            return;
          }

          if (remoteStroke.path.length > 1) {
            drawStroke(
              context,
              [
                remoteStroke.path[remoteStroke.path.length - 2],
                remoteStroke.path[remoteStroke.path.length - 1],
              ],
              remoteStroke.color,
              remoteStroke.width
            );
          } else if (remoteStroke.path.length === 1) {
            drawStroke(
              context,
              [remoteStroke.path[0], remoteStroke.path[0]],
              remoteStroke.color,
              remoteStroke.width
            );
          }

          setDrawingHistory((prevHistory) => [
            ...prevHistory,
            {
              type: "stroke",
              data: { ...remoteStroke, points: [...remoteStroke.path] },
            },
          ]);
          delete remoteDrawingActive.current[drawingCommand.userId];
        },
      }),
      [canvasReady, drawStroke]
    );

    // Function to get coordinates relative to the canvas
    const getCoordinates = useCallback(
      (e) => {
        const canvas = canvasRef.current;
        if (!canvas || !canvasReady) {
          return null;
        }

        try {
          const rect = canvas.getBoundingClientRect();
          return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          };
        } catch (error) {
          console.error("Error getting canvas coordinates:", error);
          return null;
        }
      },
      [canvasReady]
    );

    const startDrawing = useCallback(
      (e) => {
        const context = contextRef.current;
        const canvas = canvasRef.current;
        if (!context || !canvas || !canvasReady) {
          return;
        }

        const coordinates = getCoordinates(e);
        if (!coordinates) return;

        const { x, y } = coordinates;

        context.beginPath();
        context.moveTo(x, y);
        setIsDrawing(true);

        const newDrawingCommand = {
          points: [{ x, y }],
          color: strokeColor,
          width: strokeWidth,
        };

        setDrawingHistory((prev) => [
          ...prev,
          { type: "stroke", data: newDrawingCommand },
        ]);

        if (onLocalDrawStart) {
          onLocalDrawStart(newDrawingCommand);
        }
      },
      [strokeColor, strokeWidth, getCoordinates, onLocalDrawStart, canvasReady]
    );

    const draw = useCallback(
      (e) => {
        if (!isDrawing || !canvasReady) return;

        const context = contextRef.current;
        const canvas = canvasRef.current;
        if (!context || !canvas) {
          return;
        }

        const coordinates = getCoordinates(e);
        if (!coordinates) return;

        const { x, y } = coordinates;

        context.lineTo(x, y);
        context.strokeStyle = strokeColor;
        context.lineWidth = strokeWidth;
        context.stroke();

        setDrawingHistory((prev) => {
          const updatedHistory = [...prev];
          const lastCommand = updatedHistory[updatedHistory.length - 1];
          if (lastCommand && lastCommand.type === "stroke") {
            lastCommand.data.points.push({ x, y });
            if (onLocalDrawMove) {
              onLocalDrawMove(lastCommand.data);
            }
          }
          return updatedHistory;
        });
      },
      [
        isDrawing,
        strokeColor,
        strokeWidth,
        getCoordinates,
        onLocalDrawMove,
        canvasReady,
      ]
    );

    const endDrawing = useCallback(() => {
      if (!isDrawing || !canvasReady) return;

      const context = contextRef.current;
      if (!context) return;

      context.closePath();
      setIsDrawing(false);

      setDrawingHistory((prev) => {
        const lastCommand = prev[prev.length - 1];
        if (lastCommand && lastCommand.type === "stroke" && onLocalDrawEnd) {
          onLocalDrawEnd(lastCommand.data);
        }
        return prev;
      });
    }, [isDrawing, onLocalDrawEnd, canvasReady]);

    // Touch event handlers
    const handleTouchStart = useCallback(
      (e) => {
        if (e.touches && e.touches[0]) {
          startDrawing(e.touches[0]);
        }
      },
      [startDrawing]
    );

    const handleTouchMove = useCallback(
      (e) => {
        if (e.touches && e.touches[0]) {
          draw(e.touches[0]);
        }
      },
      [draw]
    );

    const handleTouchEnd = useCallback(() => {
      endDrawing();
    }, [endDrawing]);

    // Effect to add non-passive touch event listeners
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !canvasReady) return;

      const preventDefaultTouchStart = (e) => {
        e.preventDefault();
        handleTouchStart(e);
      };

      const preventDefaultTouchMove = (e) => {
        e.preventDefault();
        handleTouchMove(e);
      };

      const preventDefaultTouchEnd = (e) => {
        e.preventDefault();
        handleTouchEnd();
      };

      // Add non-passive event listeners
      canvas.addEventListener("touchstart", preventDefaultTouchStart, {
        passive: false,
      });
      canvas.addEventListener("touchmove", preventDefaultTouchMove, {
        passive: false,
      });
      canvas.addEventListener("touchend", preventDefaultTouchEnd, {
        passive: false,
      });
      canvas.addEventListener("touchcancel", preventDefaultTouchEnd, {
        passive: false,
      });

      return () => {
        // Cleanup event listeners
        canvas.removeEventListener("touchstart", preventDefaultTouchStart);
        canvas.removeEventListener("touchmove", preventDefaultTouchMove);
        canvas.removeEventListener("touchend", preventDefaultTouchEnd);
        canvas.removeEventListener("touchcancel", preventDefaultTouchEnd);
      };
    }, [canvasReady, handleTouchStart, handleTouchMove, handleTouchEnd]);

    return (
      <canvas
        ref={canvasRef}
        className="drawing-canvas w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        style={{ touchAction: "none" }}
      />
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";

export default DrawingCanvas;
