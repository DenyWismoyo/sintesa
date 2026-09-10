'use client';

import React from 'react';

export type SectionAccent = 'sky' | 'emerald' | 'amber' | 'indigo' | 'violet' | 'slate';
export type ContainerWidth = 'default' | 'wide' | 'narrow';

export interface SectionContainerProps {
  accent?: SectionAccent;
  width?: ContainerWidth;
  showGlow?: boolean;
  showTexture?: boolean;
  showGradientTop?: boolean;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

const widthClassMap: Record<ContainerWidth, string> = {
  default: 'public-container',
  wide: 'public-container-wide',
  narrow: 'public-container-narrow',
};

export function SectionContainer({
  accent = 'sky',
  width = 'default',
  showGlow = true,
  showTexture = true,
  showGradientTop = true,
  children,
  className = '',
  containerClassName = '',
}: SectionContainerProps) {
  const glowClass = `public-glow-${accent}`;
  const containerWidthClass = widthClassMap[width] || 'public-container';

  return (
    <div className={`public-page ${className}`}>
      {/* 1. Subtle Dot-Grid Texture */}
      {showTexture && <div className="public-bg-texture" aria-hidden="true" />}

      {/* 2. Top Fade Gradient */}
      {showGradientTop && <div className="public-bg-gradient-top" aria-hidden="true" />}

      {/* 3. Ambient Light Glow */}
      {showGlow && <div className={glowClass} aria-hidden="true" />}

      {/* 4. Main Responsive Content Container */}
      <div className={`${containerWidthClass} ${containerClassName}`}>
        {children}
      </div>
    </div>
  );
}

export default SectionContainer;
