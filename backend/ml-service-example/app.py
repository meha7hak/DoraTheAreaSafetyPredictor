from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()


class PredictRequest(BaseModel):
    peopleFrequency: float = Field(ge=0, le=10)
    barAvailability: float = Field(ge=0, le=10)
    policeStationAvailability: float = Field(ge=0, le=10)
    policeFrequency: float = Field(ge=0, le=10)


@app.post("/predict")
def predict(payload: PredictRequest):
    # Replace this block with your trained model inference.
    raw_score = (
        payload.peopleFrequency * 0.25
        + payload.policeStationAvailability * 0.25
        + payload.policeFrequency * 0.3
        + (10 - payload.barAvailability) * 0.2
    )
    score = round((raw_score / 10) * 100)

    if score >= 70:
        risk = "Low"
    elif score < 40:
        risk = "High"
    else:
        risk = "Moderate"

    return {"score": score, "riskLevel": risk}
