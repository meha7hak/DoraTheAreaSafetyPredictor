import { useEffect, useState } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { getMapPoints } from "../api";

const defaultCenter = [12.9716, 77.5946];

function colorForRisk(riskLevel) {
  if (riskLevel === "High") return "#d64545";
  if (riskLevel === "Low") return "#2f9e44";
  return "#f08c00";
}

function radiusForRisk(riskLevel) {
  if (riskLevel === "High") return 240;
  if (riskLevel === "Low") return 120;
  return 180;
}

function FlyToLocation({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.latitude, location.longitude], 13, { duration: 1.1 });
    }
  }, [location, map]);

  return null;
}

export default function SafetyMap() {
  const [points, setPoints] = useState([]);
  const [status, setStatus] = useState("Loading map points...");
  const [userLocation, setUserLocation] = useState(null);
  const [timeSlot, setTimeSlot] = useState("");

  async function loadPoints() {
    try {
      const data = await getMapPoints({ timeSlot, limit: 180 });
      setPoints(data.points || []);
      setStatus(data.points?.length ? "" : "No map points yet. Add reports with location.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  useEffect(() => {
    loadPoints();
    const intervalId = setInterval(loadPoints, 15000);
    return () => clearInterval(intervalId);
  }, [timeSlot]);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        // User may reject; map still works with crowd data.
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const center = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : points.length
      ? [points[0].latitude, points[0].longitude]
      : defaultCenter;

  return (
    <section className="panel map-panel">
      <div className="panel-head map-head">
        <div>
          <p className="kicker">Live Map</p>
          <h2>Real-Time Safety Zones</h2>
        </div>
        <select value={timeSlot} onChange={(event) => setTimeSlot(event.target.value)}>
          <option value="">All time slots</option>
          <option value="Morning (8 AM - 12 PM)">Morning</option>
          <option value="Evening (6 PM - 9 PM)">Evening</option>
          <option value="Late Night (9 PM - 12 AM)">Late Night</option>
          <option value="Midnight (12 AM - 4 AM)">Midnight</option>
        </select>
      </div>

      <div className="legend-row">
        <span className="legend legend-high">High danger</span>
        <span className="legend legend-moderate">Medium danger</span>
        <span className="legend legend-low">Safe</span>
      </div>

      <MapContainer center={center} zoom={12} className="safety-map" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToLocation location={userLocation} />

        {points.map((point) => {
          const color = colorForRisk(point.riskLevel);
          return (
            <Circle
              key={point.id}
              center={[point.latitude, point.longitude]}
              radius={radiusForRisk(point.riskLevel)}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.35 }}
            >
              <Popup>
                <div className="map-info-window">
                  <strong>{point.place}</strong>
                  <p>{point.zone}</p>
                  <p>{point.timeSlot}</p>
                  <p>Risk: {point.riskLevel} ({point.score}/100)</p>
                  <p>{point.note}</p>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {userLocation && (
          <CircleMarker
            center={[userLocation.latitude, userLocation.longitude]}
            radius={9}
            pathOptions={{ color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.9 }}
          >
            <Popup>
              <div className="map-info-window">
                <strong>Your Current Location</strong>
                <p>Live device location</p>
                <p>This marker shows where you are right now.</p>
              </div>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>

      {status && <p className="status-text">{status}</p>}
    </section>
  );
}
