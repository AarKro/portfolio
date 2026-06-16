import { useState } from 'react';
import { PROJECTS } from './data/projects';
import { Scene, type ViewMode } from './components/Scene/Scene';
import { TVSet } from './components/TVSet/TVSet';
import { stripInlineLinks } from './components/InlineLink/InlineLink';
import './App.scss';

/**
 * There is only one view: the 3D living room (Scene), with the DOM TV
 * projected onto the 3D TV body. The modes just describe the camera:
 *
 * tv      → parked in front of the TV: the portfolio, fully interactive
 * to-room → user powered off: camera pulls back from the glass
 * room    → first-person walking (WASD + pointer lock)
 * to-tv   → user clicked the TV: camera flies back to the website framing
 */
export function App() {
  const [mode, setMode] = useState<ViewMode>('tv');

  return (
    <main className="app">
      <Scene
        mode={mode}
        onArrivedInRoom={() => setMode('room')}
        onArrivedAtTV={() => setMode('tv')}
        onTVClicked={() => setMode('to-tv')}
      >
        <TVSet onPoweredOff={() => setMode('to-room')} />
      </Scene>

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
                {stripInlineLinks(project.description)}{' '}
                {project.behindTheScenes ? stripInlineLinks(project.behindTheScenes) : ''}
              </p>
              {project.githubUrl && <a href={project.githubUrl}>{project.title} source code</a>}
              {project.repos?.map((repo) => (
                <a key={repo.url} href={repo.url}>
                  {repo.name} source code
                </a>
              ))}
              {project.demoUrl && <a href={project.demoUrl}>{project.title} live demo</a>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
