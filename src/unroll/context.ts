import { createContext, useContext } from 'react';

/**
 * Unroll (overview → case study), README §6.2.
 * idle   – nothing running
 * focus  – the chosen yarn gets focus, the rest of the overview fades
 * jump   – the ball jumps along an arc and unravels its thread; the route changes underneath
 * settle – the ball has landed; its thread settles into place and the case study reveals its content
 */
export type UnrollPhase = 'idle' | 'focus' | 'jump' | 'settle';

export interface UnrollState {
  /** Project number (1–5) being unrolled, or null. */
  project: number | null;
  phase: UnrollPhase;
  /** Start the unroll from a yarn bundle element and navigate to `to` on the way. */
  start: (project: number, from: Element, to: string) => void;
}

export const UnrollContext = createContext<UnrollState>({ project: null, phase: 'idle', start: () => {} });

export const useUnroll = () => useContext(UnrollContext);
