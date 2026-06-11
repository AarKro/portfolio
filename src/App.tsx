import { Suspense, lazy, useEffect, useState } from 'react';
import { PROJECTS } from './data/projects';
import { TVSet } from './components/TVSet/TVSet';
import './App.scss';

// three.js only loads when (or just before) someone powers the TV off
const Room3D = lazy(() =>
  import('./components/Room3D/Room3D').then((module) => ({ default: module.Room3D })),
);

/**
 * tv      → the 2D portfolio, TV filling the page
 * to-room → user powered off: 2D layer shrinks away while the 3D camera
 *           pulls back from the TV's glass
 * room    → first-person 3D living room (WASD + pointer lock)
 * to-tv   → user clicked the 3D TV: camera flies into the glass
 */
type ViewMode = 'tv' | 'to-room' | 'room' | 'to-tv';

export function App() {
  const [mode, setMode] = useState<ViewMode>('room');
  // counts trips to the room; keys the TVSet so it remounts in standby
  const [roomVisits, setRoomVisits] = useState(0);

  const showTV = mode === 'tv' || mode === 'to-room';
  const show3D = mode !== 'tv';

  // warm up the 3D chunk in the background so powering off feels instant
  useEffect(() => {
    void import('./components/Room3D/Room3D');
  }, []);

  const tvLayerClass = [
    'tv-layer',
    roomVisits > 0 ? 'tv-layer--arriving' : '',
    mode === 'to-room' ? 'tv-layer--leaving' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className="app">
      {show3D && (
        <Suspense fallback={null}>
          <Room3D
            phase={mode === 'to-room' ? 'enter' : mode === 'room' ? 'idle' : 'leave'}
            onEnterComplete={() => setMode('room')}
            onLeaveComplete={() => {
              setRoomVisits((visits) => visits + 1);
              setMode('tv');
            }}
            onTVClick={() => setMode('to-tv')}
          />
        </Suspense>
      )}

      {showTV && (
        <div key={roomVisits} className={tvLayerClass}>
          <TVSet
            initialPoweredOn={roomVisits === 0}
            onPoweredOff={() => setMode('to-room')}
          />
        </div>
      )}

      {/*
        Crawlable text version of the broadcast. Project content only appears
        on screen after interaction, which crawlers don't do — this section
        mirrors that same content (nothing extra, so it isn't cloaking) and
        stays in sync because it renders from the same data file.
      */}
      <section className="sr-only">
        <h2>Aaron Kromer — frontend developer and interaction designer in Zürich, Switzerland</h2>
        <p>
          Portfolio of web projects: TypeScript, React, three.js, type design, machine learning
          experiments and games. Source code on{' '}
          <a href="https://github.com/AarKro">GitHub (AarKro)</a>, profile on{' '}
          <a href="https://www.linkedin.com/in/aaron-kromer-a3026b193/">LinkedIn</a>.
        </p>
        <ul>
          {PROJECTS.map((project) => (
            <li key={project.id}>
              <h3>{project.title}</h3>
              <p>
                {project.description} {project.behindTheScenes ?? ''}
              </p>
              <a href={project.githubUrl}>{project.title} source code</a>
              {project.demoUrl && <a href={project.demoUrl}>{project.title} live demo</a>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
