import ReportForm from "./components/ReportForm";
import SafetyMap from "./components/SafetyMap";
import SearchSafety from "./components/SearchSafety";

export default function App() {
  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="hero">
        <p className="eyebrow">Community Safety Network</p>
        <h1>Dora THE Area Safety Predictor</h1>
        <p className="hero-copy">
          Search an area and time to view crowd-powered safety predictions, submit your latest report, and monitor
          real-time risk circles on the live map.
        </p>
        <div className="hero-badges">
          <span>Live crowd reports</span>
          <span>Location safety circles</span>
          <span>ML-backed prediction</span>
        </div>
      </header>

      <SafetyMap />

      <section className="layout">
        <SearchSafety />
        <ReportForm />
      </section>
    </main>
  );
}
