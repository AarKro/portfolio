import { PROJECTS } from './data/projects';
import { TVSet } from './components/TVSet/TVSet';
import './App.scss';

export function App() {
  return (
    <main className="room">
      <TVSet />

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
