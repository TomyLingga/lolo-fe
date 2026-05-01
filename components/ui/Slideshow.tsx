"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
  className?: string;
  interval?: number;
  title?: string;
  subtitle?: string;
  showIndicators?: boolean;
  objectPosition?: string;
  contentClassName?: string;
}

export default function Slideshow({ 
  images, 
  className, 
  interval = 5000, 
  title, 
  subtitle,
  showIndicators = true,
  objectPosition = "center",
  contentClassName = "bottom-6 left-8"
}: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {images.map((img, i) => (
        <div
          key={img}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <img
            src={img}
            alt={`Slide ${i + 1}`}
            className={cn("w-full h-full object-cover transform scale-105")}
            style={{ 
              transition: i === current ? "transform 10s linear" : "none",
              transform: i === current ? "scale(1.1)" : "scale(1.05)",
              objectPosition: objectPosition
            }}
          />
        </div>
      ))}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent z-20" />
      
      {/* Content */}
      <div className={cn("absolute z-30", contentClassName)}>
        {subtitle && (
          <p className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.4em] mb-2 drop-shadow-md">
            {subtitle}
          </p>
        )}
        {title && (
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-lg">
            {title}
          </h2>
        )}
      </div>

      {/* Indicators */}
      {showIndicators && images.length > 1 && (
        <div className="absolute bottom-6 right-8 z-30 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1 transition-all duration-300 rounded-full",
                i === current ? "w-8 bg-brand-500" : "w-2 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
