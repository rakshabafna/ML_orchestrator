"use client";

import { Shader, Swirl, ChromaFlow, FlutedGlass, FilmGrain } from "shaders/react";

export function BackgroundShader() {
  return (
    <div className="fixed inset-0 w-full h-full z-[-1] overflow-hidden bg-transparent">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90 [&_canvas]:!w-full [&_canvas]:!h-full [&_canvas]:!object-cover">
        <Shader>
          <Swirl colorA="#e6e1d6" colorB="#f0ebe1" detail={1.7} />
          <ChromaFlow 
            baseColor="#e6e1d6" 
            downColor="#cda434" 
            leftColor="#e8d89f" 
            rightColor="#cda434" 
            upColor="#f0ebe1" 
            momentum={13} 
            radius={3.5} 
          />
          <FlutedGlass 
            aberration={0.61} 
            angle={31} 
            frequency={8} 
            highlight={0.12} 
            highlightSoftness={0} 
            lightAngle={-90} 
            refraction={4} 
            shape="rounded" 
            softness={1} 
            speed={0.15} 
          />
          <FilmGrain strength={0.08} />
        </Shader>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-background)]/50 via-[var(--color-surface-container-low)]/30 to-[var(--color-background)]/60 bg-black/5 backdrop-blur-[1px] z-10 pointer-events-none"></div>
    </div>
  );
}
