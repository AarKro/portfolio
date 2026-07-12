import { lazy, Suspense, useEffect } from 'react';
import { PROJECTS } from './data/projects';
import { GITHUB_URL, LINKEDIN_URL } from './data/profile';
import { useDeviceTier } from './hooks/useDeviceTier';
import { stripInlineLinks } from './components/InlineLink/InlineLink';
import './App.scss';

/**
 * Two code-split experiences: desktop gets the 3D room (three.js), mobile the
 * vertical feed. useDeviceTier reads the tier synchronously on first paint, so
 * the correct chunk is requested immediately — no wrong-experience flash.
 */
const DesktopExperience = lazy(() =>
  import('./components/DesktopExperience/DesktopExperience').then((m) => ({
    default: m.DesktopExperience,
  })),
);
const MobileFeed = lazy(() =>
  import('./components/MobileFeed/MobileFeed').then((m) => ({ default: m.MobileFeed })),
);

export function App() {
  const tier = useDeviceTier();

  // favicon follows the experience: CRT TV on desktop, AK monogram on mobile
  useEffect(() => {
    const link = document.getElementById('favicon');
    if (link instanceof HTMLLinkElement) {
      const file = tier === 'mobile' ? 'favicon-mobile.svg' : 'favicon.svg';
      link.href = `${import.meta.env.BASE_URL}${file}`;
    }
  }, [tier]);

  return (
    <main className="app">
      <Suspense fallback={null}>
        {tier === 'mobile' ? <MobileFeed /> : <DesktopExperience />}
      </Suspense>

      {/* Crawlable version of the project content, which is otherwise only
          reachable by interaction. Must mirror on-screen content only —
          anything extra risks being treated as cloaking. */}
      <section className="sr-only">
        <h2>Aaron Kromer — frontend developer and interaction designer in Zürich, Switzerland</h2>
        <p>
          Portfolio of web projects: TypeScript, React, three.js, type design, machine learning
          experiments and games. Source code on <a href={GITHUB_URL}>GitHub (AarKro)</a>, profile
          on <a href={LINKEDIN_URL}>LinkedIn</a>.
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
