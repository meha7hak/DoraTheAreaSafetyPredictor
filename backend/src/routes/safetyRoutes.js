import { Router } from "express";
import SafetyReport from "../models/SafetyReport.js";
import { explainScore, getSafetyPrediction } from "../services/predictionService.js";

const router = Router();

function aggregateReportFeatures(reports) {
  return reports.reduce(
    (acc, report) => {
      acc.peopleFrequency += report.peopleFrequency;
      acc.barAvailability += report.barAvailability;
      acc.policeStationAvailability += report.policeStationAvailability;
      acc.policeFrequency += report.policeFrequency;
      return acc;
    },
    {
      peopleFrequency: 0,
      barAvailability: 0,
      policeStationAvailability: 0,
      policeFrequency: 0
    }
  );
}

function averageFeatureTotals(totals, count) {
  return {
    peopleFrequency: totals.peopleFrequency / count,
    barAvailability: totals.barAvailability / count,
    policeStationAvailability: totals.policeStationAvailability / count,
    policeFrequency: totals.policeFrequency / count
  };
}

function distanceInKm(lat1, lon1, lat2, lon2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.post("/reports", async (req, res) => {
  try {
    const report = await SafetyReport.create(req.body);
    const prediction = await getSafetyPrediction(report.toObject());

    res.status(201).json({
      message: "Report submitted",
      report,
      prediction: {
        ...prediction,
        note: explainScore(prediction)
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { place, zone, timeSlot } = req.query;

    const filter = {};
    if (place) filter.place = new RegExp(`${place.trim()}`, "i");
    if (zone) filter.zone = new RegExp(`${zone.trim()}`, "i");
    if (timeSlot) filter.timeSlot = new RegExp(`${timeSlot.trim().split(" ")[0]}`, "i");

    const reports = await SafetyReport.find(filter).sort({ createdAt: -1 }).limit(20);

    if (reports.length === 0) {
      return res.json({
        message: "No reports found for this location/time",
        result: null,
        reports: []
      });
    }

    const totals = aggregateReportFeatures(reports);
    const count = reports.length;
    const averaged = averageFeatureTotals(totals, count);
    const prediction = await getSafetyPrediction(averaged);

    res.json({
      message: "Prediction generated from crowd reports",
      result: {
        filters: { place, zone, timeSlot },
        sampleSize: count,
        prediction: {
          ...prediction,
          note: explainScore(prediction)
        }
      },
      reports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/search-nearby", async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const radiusKm = Math.min(Number(req.query.radiusKm) || 2, 10);
    const { timeSlot } = req.query;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const filter = {
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    };

    if (timeSlot) filter.timeSlot = new RegExp(`${timeSlot.trim().split(" ")[0]}`, "i");

    const candidateReports = await SafetyReport.find(filter).sort({ createdAt: -1 }).limit(200);
    const nearbyReports = candidateReports
      .map((report) => ({
        report,
        distanceKm: distanceInKm(latitude, longitude, report.latitude, report.longitude)
      }))
      .filter((item) => item.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20);

    if (nearbyReports.length === 0) {
      return res.json({
        message: "No nearby reports found for your current location",
        result: null,
        reports: []
      });
    }

    const reports = nearbyReports.map((item) => ({
      ...item.report.toObject(),
      distanceKm: Number(item.distanceKm.toFixed(2))
    }));
    const totals = aggregateReportFeatures(reports);
    const count = reports.length;
    const averaged = averageFeatureTotals(totals, count);
    const prediction = await getSafetyPrediction(averaged);

    res.json({
      message: "Prediction generated from nearby location reports",
      result: {
        filters: { latitude, longitude, radiusKm, timeSlot },
        sampleSize: count,
        prediction: {
          ...prediction,
          note: explainScore(prediction)
        }
      },
      reports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/map-points", async (req, res) => {
  try {
    const { zone, timeSlot, limit } = req.query;

    const filter = {
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    };

    if (zone) filter.zone = new RegExp(`^${zone}$`, "i");
    if (timeSlot) filter.timeSlot = new RegExp(`${timeSlot.trim().split(" ")[0]}`, "i");

    const maxPoints = Math.min(Number(limit) || 120, 300);
    const reports = await SafetyReport.find(filter).sort({ createdAt: -1 }).limit(maxPoints);

    const points = await Promise.all(
      reports.map(async (report) => {
        const prediction = await getSafetyPrediction(report.toObject());
        return {
          id: report._id,
          place: report.place,
          zone: report.zone,
          timeSlot: report.timeSlot,
          latitude: report.latitude,
          longitude: report.longitude,
          score: prediction.score,
          riskLevel: prediction.riskLevel,
          source: prediction.source,
          note: explainScore(prediction),
          createdAt: report.createdAt
        };
      })
    );

    res.json({ points });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
