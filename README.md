# Women Safety Predictor (MERN)

A MERN app where:
- Women can submit area safety reports.
- Other users can search by place, zone, time, or current location.
- Everyone can view a live safety map with colored risk circles.
- Backend returns safety prediction from your ML model or fallback rules if the ML service is unavailable.

## Features
- Place
- Zone
- Time
- People frequency
- Bar availability
- Police station availability
- Police patrol frequency
- Location coordinates (latitude and longitude)
- Live map circles: red (high risk), yellow (moderate), green (low risk)
- Nearby current-location safety search

## Project Structure
- `backend/` Express + MongoDB APIs
- `frontend/` React (Vite + Leaflet + OpenStreetMap) UI

## Run Locally

### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

## Environment Variables (Backend)
- `PORT` (default: 5000)
- `MONGODB_URI`
- `ML_API_URL` (example: `http://127.0.0.1:8000/predict`)

## API Endpoints
- `POST /api/safety/reports` submit report
- `GET /api/safety/search?place=&zone=&timeSlot=` search and predict
- `GET /api/safety/search-nearby?latitude=&longitude=&radiusKm=&timeSlot=` nearby current-location search
- `GET /api/safety/map-points?zone=&timeSlot=&limit=` map circle data
- `GET /api/health` health check

## ML Service Contract
Backend sends POST request to `ML_API_URL` with:
```json
{
  "peopleFrequency": 6,
  "barAvailability": 4,
  "policeStationAvailability": 7,
  "policeFrequency": 5
}
```

Your ML service should return:
```json
{
  "score": 72,
  "riskLevel": "Low"
}
```

If ML service is down or returns invalid response, backend automatically uses fallback scoring rules.

## Optional: Run the Example ML Service
```bash
cd backend/ml-service-example
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
