import { useEffect, useRef } from 'react';
import './StaticNoise.scss';

/** Internal resolution of the noise; scaled up with pixelated rendering */
const NOISE_WIDTH = 160;
const NOISE_HEIGHT = 120;

interface StaticNoiseProps {
  /** Noise only animates while active, so an idle TV costs nothing */
  active: boolean;
}

/**
 * Classic black & white TV static, drawn on a small canvas every frame
 * and stretched across the screen.
 */
export function StaticNoise({ active }: StaticNoiseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const image = ctx.createImageData(NOISE_WIDTH, NOISE_HEIGHT);
    const pixels = image.data;
    let frame = 0;

    const draw = () => {
      for (let i = 0; i < pixels.length; i += 4) {
        const value = Math.random() * 255;
        pixels[i] = value;
        pixels[i + 1] = value;
        pixels[i + 2] = value;
        pixels[i + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
      frame = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(frame);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={`static-noise ${active ? 'static-noise--active' : ''}`}
      width={NOISE_WIDTH}
      height={NOISE_HEIGHT}
      aria-hidden="true"
    />
  );
}
