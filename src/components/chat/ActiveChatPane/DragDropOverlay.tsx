import React from "react";
import { FiImage, FiFile } from "react-icons/fi";

interface DragDropOverlayProps {
  dragType: string | null;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ dragType }) => {
  if (dragType === "image") {
    return (
      <div className="absolute inset-0 z-[100] flex flex-col pointer-events-none">
        <div className="flex-1 flex flex-col justify-center items-center backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 p-6 md:p-12">
          <div className="flex flex-col gap-6 w-full max-w-3xl h-full pb-16">
            <div className="flex-1 flex flex-col items-center justify-center border-[5px] border-dashed border-blue-500 rounded-[2.5rem] bg-white/95 dark:bg-slate-800/95 shadow-2xl transition-transform hover:scale-[1.01]">
              <FiImage className="text-6xl md:text-7xl text-blue-500 mb-4" />
              <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Drop as Image</p>
              <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mt-2">Compresses image</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center border-[5px] border-dashed border-purple-500 rounded-[2.5rem] bg-white/95 dark:bg-slate-800/95 shadow-2xl transition-transform hover:scale-[1.01]">
              <FiFile className="text-6xl md:text-7xl text-purple-500 mb-4" />
              <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Drop as File</p>
              <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mt-2">Original quality</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[100] flex flex-col pointer-events-none">
      <div className="absolute inset-4 border-4 border-dashed border-blue-500 rounded-3xl backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 flex flex-col items-center justify-center shadow-2xl z-50">
        <FiFile className="text-8xl text-blue-500 mb-6" />
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Drop files here to send them</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-4 text-xl">without compression</p>
      </div>
    </div>
  );
};

export default DragDropOverlay;
