"use client"
import { FC, useState } from 'react';
import { useDraw } from '../../hooks/useDraw'; // Ensure this path matches your project structure
import { Button } from '../../components/ui/button'; // Adjust the import path as needed

const Page: FC<{}> = () => {
  const color = '#FFDF00'; // Specify your desired color here
  const { canvasRef, onMouseDown, clear } = useDraw(color);

  return (
    <div className='w-screen h-screen bg-white flex justify-center items-center'>
      <div className='flex flex-col gap-10 pr-10'>
        <Button type='button' onClick={clear}>
          Clear canvas
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        width={750}
        height={750}
        className='border border-black rounded-md'
      />
    </div>
  );
};

export default Page;