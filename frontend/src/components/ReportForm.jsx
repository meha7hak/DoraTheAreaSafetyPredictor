import { useState } from "react";
import { createReport } from "../api";

const initialForm = {
  place: "",
  zone: "",
  timeSlot: "Evening (6 PM - 9 PM)",
  latitude: "",
  longitude: "",
  peopleFrequency: 5,
  barAvailability: 5,
  policeStationAvailability: 5,
  policeFrequency: 5,
  reporterComment: "",
  reportedBy: ""
};

const factorFields = [
  { name: "peopleFrequency", label: "People presence" },
  { name: "barAvailability", label: "Bar concentration" },
  { name: "policeStationAvailability", label: "Police station access" },
  { name: "policeFrequency", label: "Police patrol frequency" }
];

const timeOptions = [
  "Early Morning (5 AM - 8 AM)",
  "Morning (8 AM - 12 PM)",
  "Afternoon (12 PM - 4 PM)",
  "Evening (6 PM - 9 PM)",
  "Late Night (9 PM - 12 AM)",
  "Midnight (12 AM - 4 AM)"
];

function intensityLabel(value, fieldName) {
  if (fieldName === "barAvailability") {
    if (value <= 3) return "Low";
    if (value <= 7) return "Medium";
    return "High";
  }

  if (value <= 3) return "Low";
  if (value <= 7) return "Moderate";
  return "High";
}

export default function ReportForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [geoBusy, setGeoBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    const isScore = factorFields.some((field) => field.name === name);

    setForm((prev) => ({
      ...prev,
      [name]: isScore ? Number(value) : value
    }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus({ type: "error", message: "Geolocation not supported by this browser." });
      return;
    }

    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude.toFixed(6)),
          longitude: String(position.coords.longitude.toFixed(6))
        }));
        setStatus({ type: "success", message: "Current location captured." });
        setGeoBusy(false);
      },
      () => {
        setStatus({ type: "error", message: "Could not access location. Please allow location permission." });
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const payload = {
      ...form,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined
    };

    try {
      const data = await createReport(payload);
      setStatus({
        type: "success",
        message: `Saved. Risk ${data.prediction.riskLevel} (${data.prediction.score}/100) from ${data.prediction.source}.`
      });
      setForm(initialForm);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  return (
    <section className="panel report-panel">
      <div className="panel-head">
        <p className="kicker">Contribute</p>
        <h2>Share Area Report</h2>
      </div>

      <form onSubmit={handleSubmit} className="report-form">
        <div className="two-col">
          <label>
            Place
            <input name="place" placeholder="Ex: MG Road" value={form.place} onChange={handleChange} required />
          </label>

          <label>
            Zone
            <input name="zone" placeholder="Ex: Central Zone" value={form.zone} onChange={handleChange} required />
          </label>
        </div>

        <label>
          Time Slot
          <select name="timeSlot" value={form.timeSlot} onChange={handleChange}>
            {timeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="location-box">
          <div className="two-col">
            <label>
              Latitude
              <input name="latitude" value={form.latitude} onChange={handleChange} placeholder="Auto or manual" />
            </label>
            <label>
              Longitude
              <input name="longitude" value={form.longitude} onChange={handleChange} placeholder="Auto or manual" />
            </label>
          </div>
          <button type="button" className="alt-btn" onClick={useCurrentLocation} disabled={geoBusy}>
            {geoBusy ? "Fetching location..." : "Use My Current Location"}
          </button>
        </div>

        <div className="factor-grid">
          {factorFields.map((field) => (
            <label key={field.name} className="range-tile">
              <span>{field.label}</span>
              <div className="range-meta">
                <strong>{form[field.name]}</strong>
                <em>{intensityLabel(form[field.name], field.name)}</em>
              </div>
              <input type="range" min="0" max="10" name={field.name} value={form[field.name]} onChange={handleChange} />
            </label>
          ))}
        </div>

        <label>
          Your Name (Optional)
          <input name="reportedBy" placeholder="Anonymous allowed" value={form.reportedBy} onChange={handleChange} />
        </label>

        <label>
          Note (Optional)
          <textarea
            name="reporterComment"
            placeholder="Street lights good, area crowded, police van spotted, etc"
            value={form.reporterComment}
            onChange={handleChange}
            rows="3"
          />
        </label>

        <button type="submit">Submit Report</button>
      </form>

      {status.message && <p className={`status ${status.type}`}>{status.message}</p>}
    </section>
  );
}
