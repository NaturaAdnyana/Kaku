"use client";

import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";

interface OwlLogoProps {
  className?: string;
}

export function OwlLogo({ className }: OwlLogoProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    const loadOwl = async () => {
      try {
        const response = await fetch("/animations/level1.json");
        if (response.ok) {
          const data = await response.json();
          setAnimationData(data);
        }
      } catch (e) {
        console.error("Failed to load owl animation", e);
      }
    };
    loadOwl();
  }, []);

  if (!animationData) {
    return (
      <div
        className={`${className} rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse`}
      />
    );
  }

  return (
    <div className={className}>
      <Lottie animationData={animationData} loop={true} />
    </div>
  );
}
