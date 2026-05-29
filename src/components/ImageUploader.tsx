"use client";

import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  className?: string;
}

const ImageUploader = ({ onImageUpload, className }: ImageUploaderProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={cn(
        "relative group cursor-pointer border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-card/50 backdrop-blur-sm min-h-[300px]",
        className
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="flex flex-col items-center justify-center gap-4 pointer-events-none">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium">Drop your image here</p>
          <p className="text-sm text-muted-foreground">Supports PNG, JPG, WebP and more</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;