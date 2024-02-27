"use client";
import { useEffect, useRef, useState } from 'react';


// Define a type for the rectangle
type Rectangle = {
 start: { x: number; y: number };
 end: { x: number; y: number };
};


export const useDraw = (color: string) => {
 const [isDrawing, setIsDrawing] = useState(false);
 const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
 const [rectangles, setRectangles] = useState<Rectangle[]>([]);
 const canvasRef = useRef<HTMLCanvasElement>(null);


 const drawBox = (start: { x: number; y: number }, end: { x: number; y: number }) => {
   const canvas = canvasRef.current;
   const ctx = canvas?.getContext('2d');
   if (!ctx) return;


   // Draw a single rectangle
   const width = end.x - start.x;
   const height = end.y - start.y;
   ctx.beginPath();
   ctx.rect(start.x, start.y, width, height);
   ctx.strokeStyle = color;
   ctx.lineWidth = 3;
   ctx.stroke();
 };


 useEffect(() => {
   const canvas = canvasRef.current;
   const ctx = canvas?.getContext('2d');
   if (!ctx) return;

   // Function to redraw all rectangles
   const redrawRectangles = () => {
     if (!canvas) return;
     ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas first
     rectangles.forEach(rectangle => {
       drawBox(rectangle.start, rectangle.end);
     });
     
   };


   redrawRectangles();
 }, [rectangles]); // Redraw when the rectangles array changes


 const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
   const rect = canvasRef.current?.getBoundingClientRect();
   if (rect) {
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;
     setStartPoint({ x, y });
     setIsDrawing(true);
   }
 };


 const onMouseMove = (e: MouseEvent) => {
   if (!isDrawing || !startPoint) return;
   const rect = canvasRef.current?.getBoundingClientRect();
   if (rect) {
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;
     // Draw all rectangles plus the current one being drawn
     const canvas = canvasRef.current;
     const ctx = canvas?.getContext('2d');
     if (!ctx || !canvas) return;
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     rectangles.forEach(rect => drawBox(rect.start, rect.end)); // Redraw existing rectangles
     drawBox(startPoint, { x, y }); // Draw the current rectangle dynamically
   }
 };


 const onMouseUp = (e: MouseEvent) => {
   if (!startPoint) return;
   const rect = canvasRef.current?.getBoundingClientRect();
   if (rect) {
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;
     setRectangles([...rectangles, { start: startPoint, end: { x, y } }]);
     setIsDrawing(false);
   }
 };


 const clear = () => {
   const canvas = canvasRef.current;
   const ctx = canvas?.getContext('2d');
   if (ctx && canvas) {
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     setRectangles([]); // Clear the rectangles array
   }
 };


 useEffect(() => {
   const canvas = canvasRef.current;
   if (!canvas) return;


   canvas.addEventListener('mousemove', onMouseMove);
   canvas.addEventListener('mouseup', onMouseUp);


   return () => {
     canvas.removeEventListener('mousemove', onMouseMove);
     canvas.removeEventListener('mouseup', onMouseUp);
   };
 }, [isDrawing, startPoint, rectangles]); // Add rectangles to dependencies to ensure proper cleanup


 return { canvasRef, onMouseDown, clear };
};
