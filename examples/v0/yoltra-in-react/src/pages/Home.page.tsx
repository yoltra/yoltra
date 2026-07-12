import { Link } from "react-router";
import { Badge, Callout } from "@yoltra/ds";
import "./Home.css";

export function Home() {
  return (
    <div className="home">
      <section className="home__hero">
        <Badge variant="brand">Yoltra vs. Redux Toolkit</Badge>
        <h1 className="home__title">The same Todo app, built two ways</h1>
        <p className="home__lede">
          Identical UI and mocked API, once on <strong>Yoltra</strong> and once on{" "}
          <strong>Redux Toolkit</strong> — so you can compare ergonomics and re-render behavior
          side by side. Open the DevTools and watch which components actually update.
        </p>
      </section>

      <div className="home__cards">
        <article className="home__card">
          <h2>Yoltra Todo</h2>
          <p>
            Fine-grained atomic subscriptions — components read an exact state path and re-render
            only when that leaf changes. No selectors, no memoization.
          </p>
          <Link to="/yoltra" className="yl-btn yl-btn--primary">
            Open Yoltra demo →
          </Link>
        </article>

        <article className="home__card">
          <h2>Redux Toolkit Todo</h2>
          <p>
            The same features on RTK slices, selectors, and <code>react-redux</code> — the familiar
            baseline this demo measures against.
          </p>
          <Link to="/redux" className="yl-btn yl-btn--ghost">
            Open Redux demo →
          </Link>
        </article>
      </div>

      <Callout kind="info">
        <p>
          A frame-by-frame render comparison lives in <code>redux-yoltra-profiler.md</code> at the
          example root.
        </p>
      </Callout>
    </div>
  );
}
