function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateSafetyScore(features) {
  const people = clamp(features.peopleFrequency ?? 0, 0, 10);
  const bars = clamp(features.barAvailability ?? 0, 0, 10);
  const stations = clamp(features.policeStationAvailability ?? 0, 0, 10);
  const patrol = clamp(features.policeFrequency ?? 0, 0, 10);

  const rawScore =
    people * 0.25 +
    stations * 0.25 +
    patrol * 0.3 +
    (10 - bars) * 0.2;

  const score = Math.round((rawScore / 10) * 100);

  let riskLevel = "Moderate";
  if (score >= 70) riskLevel = "Low";
  if (score < 40) riskLevel = "High";

  return { score, riskLevel };
}

function normalizePrediction(payload) {
  const score = Number(payload?.score);
  const riskLevel = String(payload?.riskLevel ?? "").trim();

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return null;
  }

  if (!riskLevel) {
    return null;
  }

  return {
    score: Math.round(score),
    riskLevel
  };
}

export function explainScore({ score, riskLevel }) {
  if (riskLevel === "Low") {
    return `Area appears relatively safer right now (score ${score}/100).`;
  }
  if (riskLevel === "High") {
    return `Caution advised. Current indicators show higher risk (score ${score}/100).`;
  }
  return `Mixed indicators. Stay alert and prefer group travel if possible (score ${score}/100).`;
}

async function predictFromModelService(features) {
  const endpoint = process.env.ML_API_URL;
  if (!endpoint) return null;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features)
  });

  if (!response.ok) {
    throw new Error(`ML service returned ${response.status}`);
  }

  const data = await response.json();
  return normalizePrediction(data);
}

export async function getSafetyPrediction(features) {
  try {
    const modelPrediction = await predictFromModelService(features);
    if (modelPrediction) {
      return {
        ...modelPrediction,
        source: "ml-model"
      };
    }
  } catch (_error) {
    // Keep API available even if external model service fails.
  }

  return {
    ...calculateSafetyScore(features),
    source: "fallback-rules"
  };
}
