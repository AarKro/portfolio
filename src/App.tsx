import { lazy, Suspense, useEffect } from 'react';
import { PROJECTS } from './data/projects';
import { useDeviceTier } from './hooks/useDeviceTier';
import { stripInlineLinks } from './components/InlineLink/InlineLink';
import './App.scss';

/**
 * Two experiences (see useDeviceTier), each code-split so a visitor downloads
 * only their branch:
 *  - desktop → the full 3D living room (Scene + the DOM TV). Its chunk carries
 *    three.js and defers a further chunk (chess.js) until the TV is powered off.
 *  - mobile  → a vertical feed UI (phones AND tablets); ships no three.js.
 *
 * useDeviceTier reads the tier synchronously on first paint, so the correct
 * chunk is requested immediately — no wrong-experience flash. While a chunk
 * loads, the Suspense fallback is empty: `.app` already paints the dark scene
 * colour, so nothing flickers.
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

  // Favicon follows the experience: the CRT TV on desktop, the AK monogram
  // (social style) on the mobile feed.
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
          <a href="https://www.linkedin.com/in/aaron-kromer">LinkedIn</a>.
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
