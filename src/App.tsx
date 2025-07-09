import './App.css';
import Bubble from './components/Bubble/Bubble';

export const App = () => {
  return (
    <main className="app">
      <section className="app-section">
        <Bubble>
          test
        </Bubble>
      </section>
    </main>
  );
}