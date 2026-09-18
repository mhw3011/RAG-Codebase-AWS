import express from "express";
import { supabase } from "../services/supabaseClient.js";

const router = express.Router();

const cleanFilePath = (path = "") =>
  path.replace(/temp[\\/][^\\/]+[\\/]/g, "").replace(/\\/g, "/");

router.get("/files/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  const { data, error } = await supabase
    .from("code_chunks")
    .select("file_path, code, start_line")
    .eq("session_id", sessionId)
     .eq("user_id", req.user.id)
    .order("start_line", { ascending: true });

  if (error) {
    return res.status(500).json({
      error: "Failed to fetch files",
    });
  }

  const fileMap = {};

  // rebuild full files from chunks
  data.forEach((item) => {
    const cleanPath = cleanFilePath(item.file_path);

    if (!fileMap[cleanPath]) {
      fileMap[cleanPath] = {
        file_path: cleanPath,
        code: "",
      };
    }

    fileMap[cleanPath].code += item.code + "\n";
  });

  res.json(Object.values(fileMap));
});

export default router;
