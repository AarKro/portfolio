/** Smoothstep ease-in-out, shared by the camera flights and the chess tweens. */
export const easeInOut = (t: number) => t * t * (3 - 2 * t);
