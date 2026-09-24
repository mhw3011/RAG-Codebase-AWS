import "dotenv/config";
import express from "express";
import cors from "cors";

import { loadSecrets } from "./services/ssmService.js";

await loadSecrets();
const { requireAuth } = await import("./middleware/authMiddleware.js");
const { default: uploadRoute } = await import("./routes/upload.js");
const { default: queryRoute } = await import("./routes/query.js");
const { default: filesRoute } = await import("./routes/files.js");

const app = express();

app.use(
  cors({
    origin: [
      "https://main.d1j71r2hhqttrr.amplifyapp.com",
      "http://localhost:5173",
    ],
  }),
);
app.use(express.json());

app.use("/api", requireAuth, uploadRoute);
app.use("/api", requireAuth, queryRoute);
app.use("/api", requireAuth, filesRoute);

app.get("/", (req, res) => {
  res.send("Codebase RAG running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
