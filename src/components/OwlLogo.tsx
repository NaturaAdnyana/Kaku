"use client";

import React from "react";
import { LottiePlayer } from "@/components/LottieCanvas";
import { useLottieAnimation } from "@/hooks/useLottieAnimation";

interface OwlLogoProps {
  className?: string;
}

export function OwlLogo({ className }: OwlLogoProps) {
  const { animationData } = useLottieAnimation("level1.json");

  if (!animationData) {
    return <div className={className} />;
  }

  return (
    <div className={className}>
      <LottiePlayer animationData={animationData} loop={true} maxFps={15} />
    </div>
  );
}
