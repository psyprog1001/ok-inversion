"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { rgbToOklab, gamutMap, linearToSrgbUint8 } from '@/utils/color-space';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Eye, EyeOff, Upload } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface HueInverterProps {
  file: File;
  onReset: () => void;
  onImageUpload: (file: File) => void;
}

const HueInverter = ({ file, onReset, onImageUpload }: HueInverterProps) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [processedUrl, setProcessedUrl] = useState<string>('');
  
  const dragCounter = useRef(0);
  
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      processImage(img);
    };
    img.onerror = () => {
      showError("Failed to load image");
      onReset();
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        setShowOriginal(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Control') {
        setShowOriginal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const processImage = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const [L, a, b_] = rgbToOklab(r, g, b);
      const invertedA = -a;
      const invertedB = -b_;
      const linearRgb = gamutMap(L, invertedA, invertedB);
      const [finalR, finalG, finalB] = linearToSrgbUint8(linearRgb);

      data[i] = finalR;
      data[i + 1] = finalG;
      data[i + 2] = finalB;
    }

    ctx.putImageData(imageData, 0, 0);
    setProcessedUrl(canvas.toDataURL(file.type, 1.0));
    setIsProcessing(false);
    showSuccess("Image processed successfully!");
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `inverted-${file.name}`;
    link.href = processedUrl;
    link.click();
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      onImageUpload(droppedFile);
    }
  }, [onImageUpload]);

  return (
    <div 
      className="flex flex-col gap-6 w-full max-w-4xl mx-auto"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onReset} className="text-white border-white/20 hover:bg-white/10">
            <RefreshCw className="w-4 h-4 mr-2" />
            New Image
          </Button>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            className="bg-white/10 text-white hover:bg-white/20"
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
            title="Hold Ctrl + Spacebar to compare"
          >
            {showOriginal ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Hold to Compare
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={isProcessing} className="bg-white text-black hover:bg-white/90">
            <Download className="w-4 h-4 mr-2" />
            Save Result
          </Button>
        </div>
      </div>

      <div className={cn(
        "relative aspect-auto min-h-[300px] rounded-2xl overflow-hidden border-4 shadow-2xl bg-black/20 flex items-center justify-center group transition-all duration-200",
        isDragging ? "border-primary scale-[1.01] bg-primary/5" : "border-card"
      )}>
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-medium">Processing OKLab Inversion...</p>
          </div>
        ) : (
          <>
            <img
              src={showOriginal ? originalUrl : processedUrl}
              alt="Preview"
              className="max-w-full max-h-[70vh] object-contain transition-opacity duration-200"
              onMouseDown={(e) => {
                if (e.button === 0) setShowOriginal(true);
              }}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
            />
            
            {isDragging && (
              <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200 pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl">
                  <Upload className="w-8 h-8 text-primary-foreground" />
                </div>
                <p className="text-xl font-bold text-white">Drop to load new image</p>
              </div>
            )}

            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              {showOriginal ? 'Original' : 'OKLab Inverted'}
            </div>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-1">OKLab Space</h4>
          <p className="text-xs text-muted-foreground">Perceptually uniform hue rotation</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-1">Gamut Mapping</h4>
          <p className="text-xs text-muted-foreground">Chroma scaling to prevent clipping</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-1">Full Resolution</h4>
          <p className="text-xs text-muted-foreground">Export in original format & quality</p>
        </div>
      </div>
    </div>
  );
};

export default HueInverter;