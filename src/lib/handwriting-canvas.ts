import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";

import type { Trace } from "@/lib/handwriting";

type CanvasPointerEvent =
  | ReactMouseEvent
  | ReactTouchEvent
  | MouseEvent
  | TouchEvent;

type CanvasColors = {
  guideColor: string;
  strokeColor: string;
};

const DEFAULT_STROKE_WIDTH = 6;
const DEFAULT_DOT_RADIUS = 3;
const DEFAULT_MAX_CANVAS_SIZE = 400;

export function resizeSquareCanvas(
  canvas: HTMLCanvasElement | null,
  container: HTMLElement | null,
  maxSize: number = DEFAULT_MAX_CANVAS_SIZE,
) {
  if (!canvas || !container) {
    return false;
  }

  const size = Math.min(container.clientWidth, maxSize);
  canvas.width = size;
  canvas.height = size;
  return true;
}

export function redrawHandwritingCanvas(
  canvas: HTMLCanvasElement | null,
  traces: Trace,
  colors: CanvasColors,
) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = colors.guideColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeStyle = colors.strokeColor;
  ctx.lineWidth = DEFAULT_STROKE_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  traces.forEach((stroke) => {
    const xs = stroke[0];
    const ys = stroke[1];
    if (xs.length === 0) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) {
      ctx.lineTo(xs[i], ys[i]);
    }
    ctx.stroke();
  });
}

export function getCanvasCoordinates(
  canvas: HTMLCanvasElement | null,
  event: CanvasPointerEvent,
) {
  if (!canvas) {
    return { x: 0, y: 0 };
  }

  let clientX: number;
  let clientY: number;

  if ("touches" in event) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export function drawStrokeDot(
  canvas: HTMLCanvasElement | null,
  x: number,
  y: number,
  strokeColor: string,
) {
  const ctx = canvas?.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.beginPath();
  ctx.arc(x, y, DEFAULT_DOT_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = strokeColor;
  ctx.fill();
}

export function drawStrokeSegment(
  canvas: HTMLCanvasElement | null,
  from: { x: number; y: number },
  to: { x: number; y: number },
  strokeColor: string,
) {
  const ctx = canvas?.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = DEFAULT_STROKE_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}
