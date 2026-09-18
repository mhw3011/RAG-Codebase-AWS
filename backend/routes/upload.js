import express from "express";
import { v4 as uuidv4 } from "uuid";
import { sendProcessingJob } from "../services/sqsService.js";
import { createUserSupabaseClient } from "../services/supabaseUserClient.js";

const router = express.Router();

router.post("/upload-repo", async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({
        error: "repoUrl is required",
      });
    }

    const token = req.headers.authorization?.replace("Bearer ", "");
    const supabase = createUserSupabaseClient(token);

    const sessionId = uuidv4();

    // Create job record
    const { error: dbError } = await supabase
      .from("processing_jobs")
      .insert({
        session_id: sessionId,
        status: "queued",
	user_id: req.user.id,
      });

    if (dbError) {
      console.error("Job creation error:", dbError);

      return res.status(500).json({
        error: "Failed to create processing job",
      });
    }

    // Send job to SQS
    await sendProcessingJob({
      repoUrl,
      sessionId,
      userId: req.user.id,
    });

    return res.json({
      message: "Repository processing queued",
      sessionId,
    });
  } catch (err) {
    console.error("Queue Error:", err);

    return res.status(500).json({
      error: "Failed to queue repository",
    });
  }
});

router.get("/status/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const token = req.headers.authorization?.replace("Bearer ", "");
    const supabase = createUserSupabaseClient(token);

    const { data, error } = await supabase
      .from("processing_jobs")
      .select("status, error")
      .eq("session_id", sessionId)
      .eq("user_id", req.user.id)
      .single();

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch job status",
      });
    }

    return res.json(data);
  } catch (err) {
    console.error("Status Error:", err);

    return res.status(500).json({
      error: "Failed to fetch job status",
    });
  }
});

export default router;
