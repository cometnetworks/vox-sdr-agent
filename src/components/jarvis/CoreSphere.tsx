"use client";

import { useEffect, useRef } from "react";

export type CoreState = "idle" | "listening" | "speaking" | "thinking";

type Node = { x: number; y: number; z: number };

const NODE_COUNT = 220;
const LINK_DISTANCE = 0.42;

const stateTuning: Record<CoreState, { spin: number; glow: number; pulse: number }> = {
  idle: { spin: 0.0016, glow: 0.55, pulse: 0.012 },
  listening: { spin: 0.0026, glow: 0.85, pulse: 0.035 },
  thinking: { spin: 0.0042, glow: 0.95, pulse: 0.05 },
  speaking: { spin: 0.0034, glow: 1, pulse: 0.075 },
};

function buildSphere(count: number): Node[] {
  const nodes: Node[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / (count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * index;

    nodes.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
    });
  }

  return nodes;
}

export function CoreSphere({ state }: { state: CoreState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CoreState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = buildSphere(NODE_COUNT);

    let width = 0;
    let height = 0;
    let frame = 0;
    let angleY = 0;
    let angleX = -0.28;
    let energy = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const render = (time: number) => {
      const tuning = stateTuning[stateRef.current];
      const target = stateRef.current === "idle" ? 0.2 : 1;
      energy += (target - energy) * 0.05;

      if (!reduceMotion) {
        angleY += tuning.spin;
        angleX += tuning.spin * 0.18;
      }

      const breath = 1 + Math.sin(time / 620) * tuning.pulse * (0.4 + energy);
      const radius = Math.min(width, height) * 0.34 * breath;
      const centerX = width / 2;
      const centerY = height / 2;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const projected = nodes.map((node) => {
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        const y1 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;
        const depth = 1.9 / (2.6 - z2);

        return {
          sx: centerX + x1 * radius * depth,
          sy: centerY + y1 * radius * depth,
          depth: (z2 + 1) / 2,
          nx: x1,
          ny: y1,
          nz: z2,
        };
      });

      context.clearRect(0, 0, width, height);

      const halo = context.createRadialGradient(
        centerX,
        centerY,
        radius * 0.1,
        centerX,
        centerY,
        radius * 2.1,
      );
      halo.addColorStop(0, `rgba(53, 212, 199, ${0.24 * tuning.glow})`);
      halo.addColorStop(0.45, `rgba(53, 212, 199, ${0.07 * tuning.glow})`);
      halo.addColorStop(1, "rgba(4, 7, 10, 0)");
      context.fillStyle = halo;
      context.fillRect(0, 0, width, height);

      context.lineWidth = 0.6;

      for (let i = 0; i < projected.length; i += 1) {
        const a = projected[i];

        for (let j = i + 1; j < projected.length; j += 1) {
          const b = projected[j];
          const dx = a.nx - b.nx;
          const dy = a.ny - b.ny;
          const dz = a.nz - b.nz;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance > LINK_DISTANCE) {
            continue;
          }

          const fade = 1 - distance / LINK_DISTANCE;
          const depth = (a.depth + b.depth) / 2;
          const alpha = fade * depth * 0.32 * tuning.glow;

          context.strokeStyle = `rgba(90, 236, 220, ${alpha})`;
          context.beginPath();
          context.moveTo(a.sx, a.sy);
          context.lineTo(b.sx, b.sy);
          context.stroke();
        }
      }

      for (const point of projected) {
        const size = 0.7 + point.depth * 1.9;
        const alpha = 0.25 + point.depth * 0.75 * tuning.glow;

        context.fillStyle = `rgba(196, 255, 248, ${alpha})`;
        context.beginPath();
        context.arc(point.sx, point.sy, size, 0, Math.PI * 2);
        context.fill();
      }

      const core = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius * 0.75,
      );
      core.addColorStop(0, `rgba(215, 255, 250, ${0.5 * tuning.glow})`);
      core.addColorStop(0.35, `rgba(53, 212, 199, ${0.16 * tuning.glow})`);
      core.addColorStop(1, "rgba(4, 7, 10, 0)");
      context.fillStyle = core;
      context.beginPath();
      context.arc(centerX, centerY, radius * 0.75, 0, Math.PI * 2);
      context.fill();

      frame = window.requestAnimationFrame(render);
    };

    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="size-full" aria-hidden />;
}
