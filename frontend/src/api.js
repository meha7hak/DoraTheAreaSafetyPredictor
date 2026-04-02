const API_BASE = "http://localhost:5000/api";

export async function createReport(payload) {
  const response = await fetch(`${API_BASE}/safety/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to submit report");
  return data;
}

export async function searchSafety(query) {
  const params = new URLSearchParams(query);
  const response = await fetch(`${API_BASE}/safety/search?${params.toString()}`);

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Search failed");
  return data;
}

export async function searchNearbySafety(query) {
  const params = new URLSearchParams(query);
  const response = await fetch(`${API_BASE}/safety/search-nearby?${params.toString()}`);

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Nearby search failed");
  return data;
}

export async function getMapPoints(query = {}) {
  const params = new URLSearchParams(query);
  const response = await fetch(`${API_BASE}/safety/map-points?${params.toString()}`);

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load map data");
  return data;
}
