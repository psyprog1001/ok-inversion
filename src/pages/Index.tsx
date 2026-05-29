"use client";

import React, { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import HueInverter from '@/components/HueInverter';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Palette } from 'lucide-react';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-xl mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
            <Palette className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            OKLab Hue Inverter
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Invert image hues with perceptual uniformity. Using OKLab color space and smart gamut mapping to preserve lightness and detail.
          </p>
        </header>

        {/* Main Content */}
        <main className="flex flex-col items-center justify-center min-h-[400px]">
          {!selectedFile ? (
            <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <ImageUploader onImageUpload={setSelectedFile} />
              
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                <div className="space-y-2">
                  <h3 className="font-bold text-white">Why OKLab?</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlike standard RGB or HSL, OKLab is designed to match human perception. Inverting hue here ensures that colors feel equally bright and saturated after the shift.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-white">Smart Gamut Mapping</h3>
                  <p className="text-sm text-muted-foreground">
                    When an inverted color falls outside the sRGB range, we intelligently scale its chroma down while keeping its hue and lightness perfectly intact.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full animate-in zoom-in-95 duration-500">
              <HueInverter 
                file={selectedFile} 
                onReset={() => setSelectedFile(null)} 
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="pt-12 border-t border-border/50">
          <MadeWithDyad />
        </footer>
      </div>
    </div>
  );
};

export default Index;