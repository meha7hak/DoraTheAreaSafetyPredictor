import { useState } from "react";
import { searchNearbySafety, searchSafety } from "../api";

const quickTimes = [
  "Evening (6 PM - 9 PM)",
  "Late Night (9 PM - 12 AM)",
  "Midnight (12 AM - 4 AM)",
  "Morning (8 AM - 12 PM)"
];

function riskClass(riskLevel) {
  if (riskLevel === "Low") return "risk-low";
  if (riskLevel === "High") return "risk-high";
  return "risk-moderate";
}

export default function SearchSafety() {
  const [query, setQuery] = useState({ place: "", zone: "", timeSlot: "Evening (6 PM - 9 PM)" });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [searchMode, setSearchMode] = useState("place");

  function handleChange(event) {
    setQuery((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function handleSearch(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSearchMode("place");

    try {
      const data = await searchSafety(query);
      setResult(data.result);
      setReports(data.reports || []);
      setMessage(data.message || "");
    } catch (error) {
      setResult(null);
      setReports([]);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    setLoading(true);
    setMessage("");
    setSearchMode("nearby");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await searchNearbySafety({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radiusKm: 2,
            timeSlot: query.timeSlot
          });
          setResult(data.result);
          setReports(data.reports || []);
          setMessage(data.message || "");
        } catch (error) {
          setResult(null);
          setReports([]);
          setMessage(error.message);
        } finally {
          setLocating(false);
          setLoading(false);
        }
      },
      () => {
        setMessage("Could not access your current location. Please allow location permission and try again.");
        setLocating(false);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <section className="panel search-panel">
      <div className="panel-head">
        <p className="kicker">Explore</p>
        <h2>Search Area Safety</h2>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <label>
          Area
          <input name="place" placeholder="Ex: Koramangala" value={query.place} onChange={handleChange} />
        </label>

        <label>
          Zone
          <input name="zone" placeholder="Ex: South Zone" value={query.zone} onChange={handleChange} />
        </label>

        <label>
          Time Slot
          <input name="timeSlot" placeholder="Choose from chips or type" value={query.timeSlot} onChange={handleChange} />
        </label>

        <div className="chip-row">
          {quickTimes.map((slot) => (
            <button
              key={slot}
              type="button"
              className={`chip ${query.timeSlot === slot ? "chip-active" : ""}`}
              onClick={() => setQuery((prev) => ({ ...prev, timeSlot: slot }))}
            >
              {slot}
            </button>
          ))}
        </div>

        <div className="search-actions">
          <button type="submit" disabled={loading || !query.place.trim()}>
            {loading && searchMode === "place" ? "Checking Safety..." : "Search Safety"}
          </button>
          <button type="button" className="alt-btn" onClick={handleUseCurrentLocation} disabled={loading && searchMode === "nearby"}>
            {locating ? "Finding Your Area..." : "Use Current Location"}
          </button>
        </div>
      </form>

      {message && <p className="status-text">{message}</p>}

      {result && (
        <div className={`prediction-card ${riskClass(result.prediction.riskLevel)}`}>
          <div className="prediction-head">
            <h3>{result.prediction.riskLevel} Risk</h3>
            <span>{result.prediction.score}/100</span>
          </div>
          <p>{result.prediction.note}</p>
          <div className="prediction-meta">
            <span>Source: {result.prediction.source}</span>
            <span>Reports used: {result.sampleSize}</span>
            <span>{searchMode === "nearby" ? "Current location search" : "Place search"}</span>
          </div>
        </div>
      )}

      {reports.length > 0 && (
        <div className="report-list">
          <h3>Recent Reports</h3>
          {reports.map((report) => (
            <article key={report._id} className="report-item">
              <header>
                <strong>{report.place}</strong>
                <span>{report.timeSlot}</span>
              </header>
              <p>{report.zone}</p>
              <p>
                People {report.peopleFrequency} | Bars {report.barAvailability} | Station {report.policeStationAvailability} | Patrol {report.policeFrequency}
              </p>
              {typeof report.distanceKm === "number" && <p>Distance: {report.distanceKm} km away</p>}
              {report.reporterComment && <p>Note: {report.reporterComment}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
