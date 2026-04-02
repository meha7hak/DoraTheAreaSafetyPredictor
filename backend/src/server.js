import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDB } from "./db.js";
import safetyRoutes from "./routes/safetyRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/safety", safetyRoutes);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to DB", error.message);
    process.exit(1);
  });
