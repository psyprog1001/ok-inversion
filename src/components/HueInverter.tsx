"use client";

import React, { useEffect, useRef, useState } from 'react';
import { rgbToOklab, gamutMap, linearToSrgbUint8 } from '@/utils/color-space';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface HueInverterProps {
  file: File;
  onReset: () => void;
}

const HueInverter = ({ file, onReset }: HueInverterProps) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [processedUrl, setProcessedUrl] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

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

  const processImage = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Process pixels in OKLab
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 1. Convert to OKLab
      const [L, a, b_] = rgbToOklab(r, g, b);

      // 2. Invert Hue (rotate 180 degrees in a-b plane)
      const invertedA = -a;
      const invertedB = -b_;

      // 3. Gamut map back to sRGB (preserving L and hue)
      const linearRgb = gamutMap(L, invertedA, invertedB);
      const [finalR, finalG, finalB] = linearToSrgbUint8(linearRgb);

      data[i] = finalR;
      data[i + 1] = finalG;
      data[i + 2] = finalB;
    }

    ctx.putImageData(imageData, 0, 0);
    setProcessedUrl(canvas.toDataURL(file.type));
    setIsProcessing(false);
    showSuccess("Image processed successfully!");
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `inverted-${file.name}`;
    link.href = processedUrl;
    link.click();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onReset}>
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
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
          >
            {showOriginal ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Hold to Compare
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={isProcessing}>
            <Download className="w-4 h-4 mr-2" />
            Save Result
          </Button>
        </div>
      </div>

      <div className="relative aspect-auto min-h-[300px] rounded-2xl overflow-hidden border-4 border-card shadow-2xl bg-neutral-900 flex items-center justify-center group">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              {showOriginal ? 'Original' : 'OKLab Inverted'}
            </div>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <h4 className="text-sm font-semibold text-blue-600 mb-1">OKLab Space</h4>
          <p className="text-xs text-muted-foreground">Perceptually uniform hue rotation</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
          <h4 className="text-sm font-semibold text-purple-600 mb-1">Gamut Mapping</h4>
          <p className="text-xs text-muted-foreground">Chroma scaling to prevent clipping</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <h4 className="text-sm font-semibold text-emerald-600 mb-1">Full Resolution</h4>
          <p className="text-xs text-muted-foreground">Export in original format & quality</p>
        </div>
      </div>
    </div>
  );
};

export default HueInverter;