/** Fills an ImageData pixel buffer with one frame of B&W TV static. */
export function fillNoise(pixels: Uint8ClampedArray): void {
  for (let i = 0; i < pixels.length; i += 4) {
    const value = (Math.random() * 255) | 0;
    pixels[i] = value;
    pixels[i + 1] = value;
    pixels[i + 2] = value;
    pixels[i + 3] = 255;
  }
}
