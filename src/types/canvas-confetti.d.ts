declare module "canvas-confetti" {
  type Origin = {
    x?: number;
    y?: number;
  };

  type Options = {
    angle?: number;
    disableForReducedMotion?: boolean;
    drift?: number;
    gravity?: number;
    origin?: Origin;
    particleCount?: number;
    scalar?: number;
    spread?: number;
    startVelocity?: number;
    ticks?: number;
    zIndex?: number;
  };

  export default function confetti(options?: Options): Promise<null> | null;
}
