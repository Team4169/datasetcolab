"use client"
import React, { useState, useEffect, useRef } from 'react';
import {Button} from '../../components/ui/button';
import './DrawableCanvas.css'; // Importing a separate CSS file for styles

interface Rectangle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label: string; // Add label property to Rectangle interface
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
    image.src = 'https://www.firstinspires.org/sites/default/files/uploads/hero_headers/header-image_1.jpg'
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

    // Show label with the rectangle
    context.fillStyle = color;
    context.font = '14px Arial';
    context.fillText(rect.label, rect.startX * scale, rect.startY * scale - 5);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setIsDrawing(true);
      const startX = (e.clientX - rect.left) / scale;
      const startY = (e.clientY - rect.top) / scale;
      setCurrentRect({ startX, startY, endX: startX, endY: startY, label: '' }); // Initialize label as empty string
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
      const label = prompt('Enter a label for the rectangle'); // Ask user for label
      if (label) {
        setRectangles([...rectangles, { ...currentRect, label }]);
        console.log(`Rectangle label: ${label}`); // Print the rectangle's label to console
        console.log(`Rectangle corners: (${currentRect.startX * scale}, ${currentRect.startY * scale}), (${currentRect.endX * scale}, ${currentRect.startY * scale}), (${currentRect.startX * scale}, ${currentRect.endY * scale}), (${currentRect.endX * scale}, ${currentRect.endY * scale})`);
      }
      setCurrentRect(null);
    }
    setIsDrawing(false);
  };

  // Add UI for changing color
  const handleChangeColor = (newColor: string) => {
    setColor(newColor);
  };
  const handleClearRectangles = () => {
    setRectangles([]);
  }
  // className="color-button red"
  // className="color-button green"
  // className="color-button blue"
  // className="control-button"
  return (
    <div className="annotation-container">
      <div className="toolbar">
        <Button style={{ marginRight: '10px' }} onClick={() => handleChangeColor('red')}>Red</Button>
        <Button style={{ marginRight: '10px' }} onClick={() => handleChangeColor('green')}>Green</Button>
        <Button style={{ marginRight: '10px' }} onClick={() => handleChangeColor('blue')}>Blue</Button>
        <Button onClick={() => handleClearRectangles()}>Clear</Button>
      </div>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="drawable-canvas"
        />
      </div>
    </div>
  );
};


export default DrawableCanvas;