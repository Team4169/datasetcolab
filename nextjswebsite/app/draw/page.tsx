"use client"
import React, { useState, useEffect, useRef } from 'react';

interface Rectangle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const DrawableCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);
  const [color, setColor] = useState<string>('yellow');
  const [scale, setScale] = useState<number>(1); // Scale factor for drawing

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const image = new Image();
    image.src = 'https://www.firstinspires.org/sites/default/files/uploads/hero_headers/header-image_1.jpg';
    image.onload = () => {
      if (canvas && context) {
        const scaleToFit = Math.min(750 / image.width, 750 / image.height);
        setScale(scaleToFit);
        canvas.width = 750;
        canvas.height = 750;
        context.drawImage(image, 0, 0, image.width * scaleToFit, image.height * scaleToFit);
        rectangles.forEach(rect => {
          drawRectangle(context, rect, scaleToFit);
        });
        if (currentRect) {
          drawRectangle(context, currentRect, scaleToFit);
        }
      }
    };
  }, [rectangles, currentRect, color]);

  const drawRectangle = (context: CanvasRenderingContext2D, rect: Rectangle, scale: number) => {
    context.beginPath();
    context.rect(
      rect.startX * scale, 
      rect.startY * scale, 
      (rect.endX - rect.startX) * scale, 
      (rect.endY - rect.startY) * scale
    );
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();

    // Print coordinates of the rectangle corners, adjusted for scale
    console.log(`Rectangle corners: (${rect.startX * scale}, ${rect.startY * scale}), (${rect.endX * scale}, ${rect.startY * scale}), (${rect.startX * scale}, ${rect.endY * scale}), (${rect.endX * scale}, ${rect.endY * scale})`);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setIsDrawing(true);
      const startX = (e.clientX - rect.left) / scale;
      const startY = (e.clientY - rect.top) / scale;
      setCurrentRect({ startX, startY, endX: startX, endY: startY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentRect) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setCurrentRect({
        ...currentRect,
        endX: (e.clientX - rect.left) / scale,
        endY: (e.clientY - rect.top) / scale,
      });
    }
  };

  const handleMouseUp = () => {
    if (currentRect) {
      setRectangles([...rectangles, currentRect]);
      setCurrentRect(null);
    }
    setIsDrawing(false);
  };

  // Add UI for changing color
  const handleChangeColor = (newColor: string) => {
    setColor(newColor);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ width: '750px', height: '750px' }} // Adjust canvas size for CSS, keeping actual drawing scaled
      />
      <div>
        <button onClick={() => handleChangeColor('red')}>Red</button>
        <button onClick={() => handleChangeColor('green')}>Green</button>
        <button onClick={() => handleChangeColor('blue')}>Blue</button>
      </div>
    </>
  );
};

export default DrawableCanvas;