import express from "express";
import "dotenv/config";
import OpenAI from "openai";

import { getEmbedding } from "../services/embeddingService.js";
import { supabase } from "../services/supabaseClient.js";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cleanFilePath = (path = "") =>
  path.replace(/temp[\\/][^\\/]+[\\/]/g, "").replace(/\\/g, "/");

router.post("/query", async (req, res) => {
  try {
    const { question, sessionId } = req.body;
    console.log("Query session:", sessionId);
    if (!question || !sessionId) {
      return res.status(400).json({
        error: "missing input",
      });
    }

const { data: job, error: jobError } = await supabase
  .from("processing_jobs")
  .select("session_id")
  .eq("session_id", sessionId)
  .eq("user_id", req.user.id)
  .single();

if (jobError || !job) {
  return res.status(403).json({
    error: "You do not have access to this repository",
  });
}

    // generate query embedding
    console.time("Embedding");

    const queryEmbedding = await getEmbedding(question);

    console.timeEnd("Embedding");

    console.time("Supabase simple query");

    await supabase
  .from("code_chunks")
  .select("id")
  .limit(1);

console.timeEnd("Supabase simple query");

    // semantic retrieval
    console.time("Supabase search");

    const { data: chunks, error } = await supabase.rpc("match_code_chunks", {
      query_embedding: queryEmbedding,
      match_count: 6,
      session_filter: sessionId,
    });
    
    console.timeEnd("Supabase search");

    if (error) {
      return res.status(500).json({
        error: "db error",
      });
    }

    if (!chunks?.length) {
      return res.json({
        answer: "No relevant code found.",
        sources: [],
      });
    }

    // build semantic context
    const context = chunks
      .map(
        (c) => `
File: ${cleanFilePath(c.file_path)}
Lines: ${c.start_line}-${c.end_line}

Code:
${c.code}
`,
      )
      .join("\n\n---\n\n");

    // ask LLM

    console.time("GPT");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a semantic codebase RAG assistant.

RULES:

1. Answer ONLY using the provided code context.
2. Be technical and concise.
3. Do NOT hallucinate files/functions.
4. Explain actual implementation details from the code.
5. Mention only truly relevant files.
6. Do NOT output temp paths.
7. Focus on implementation flow, not theory.

OUTPUT FORMAT:

Answer:
<technical explanation>

Relevant Files:
- file path
- what it does
- important implementation details
`,
        },
        {
          role: "user",
          content: `
Context:
${context}

Question:
${question}
`,
        },
      ],
    });

console.timeEnd("GPT");

    let raw = completion.choices[0].message.content;

    // clean temp paths
    raw = raw.replace(/temp[\\/][^\\/]+[\\/]/g, "");

    // use top retrieved chunks directly
    const sources = chunks.map((c) => ({
      file: cleanFilePath(c.file_path),
      startLine: c.start_line,
      endLine: c.end_line,
      code: c.code,
    }));

    return res.json({
      answer: raw,
      sources,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "failed",
    });
  }
});

export default router;
