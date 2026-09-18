import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";

import { loadSecrets } from "./services/ssmService.js";

await loadSecrets();

const { cloneRepo } = await import("./services/gitService.js");
const { getAllFiles } = await import("./utils/fileReader.js");
const { extractCodeChunks } = await import("./services/parserService.js");
const { getEmbeddings } = await import("./services/embeddingService.js");
const { supabaseAdmin } = await import("./services/supabaseAdminClient.js");
const { uploadFile } = await import("./services/s3Service.js");

import fs from "fs";
import path from "path";

const sqs = new SQSClient({
  region: "ap-south-1",
});

const QUEUE_URL = "https://sqs.ap-south-1.amazonaws.com/042522012026/codebase-rag-processing";

async function receiveJob() {
  const command = new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 10,
  });

  const response = await sqs.send(command);

  if (!response.Messages || response.Messages.length === 0) {
    return null;
  }

  return response.Messages[0];
}

async function deleteJob(receiptHandle) {
  const command = new DeleteMessageCommand({
    QueueUrl: QUEUE_URL,
    ReceiptHandle: receiptHandle,
  });

  await sqs.send(command);
}

async function startWorker() {
  console.log("SQS worker started");

  while (true) {
    const message = await receiveJob();

    if (!message) {
      continue;
    }

    let job;

    try {
      console.log("Received job:", message.Body);

      job = JSON.parse(message.Body);

      // Mark job as processing
      const { error: processingError } = await supabaseAdmin
        .from("processing_jobs")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", job.sessionId);

      if (processingError) {
        throw processingError;
      }

      console.log("Job status: processing");
      console.log("Repository URL:", job.repoUrl);

      const sessionId = job.sessionId;

      // Clone repository
      const { repoPath } = await cloneRepo(job.repoUrl);

      console.log("Repository cloned:", sessionId);

      // Find files
      const files = getAllFiles(repoPath);

      console.log(`Files found: ${files.length}`);
      console.log("Files:", files);

      // Upload files to S3
      for (const file of files) {
        const fileContent = await fs.promises.readFile(file);

        const relativePath = path.relative(repoPath, file);

        const s3Key = `repositories/${sessionId}/${relativePath}`;

        await uploadFile(s3Key, fileContent);
      }

      console.log("Files uploaded to S3");

      // Extract chunks
      let allChunks = [];

      for (const file of files) {
        let chunks = [];

        try {
          chunks = extractCodeChunks(file);
        } catch (err) {
          console.error("Chunk extraction failed:", file);
          throw err;
        }

        const enrichedChunks = chunks.map((chunk) => ({
          ...chunk,
          filePath: file,
          sessionId,
        }));

        allChunks.push(...enrichedChunks);
      }

      console.log(`Total chunks extracted: ${allChunks.length}`);

      // Generate embeddings and store chunks
const texts = allChunks.map((chunk) => chunk.code);

console.log("Generating embeddings...");

const embeddings = await getEmbeddings(texts);

console.log(`Generated embeddings: ${embeddings.length}`);

const rows = allChunks.map((chunk, index) => ({
  session_id: chunk.sessionId,
  user_id: job.userId,
  file_path: chunk.filePath,
  type: chunk.type,
  name: chunk.name,
  code: chunk.code,
  start_line: chunk.startLine,
  end_line: chunk.endLine,
  embedding: embeddings[index],
}));

const { error: insertError } = await supabaseAdmin
  .from("code_chunks")
  .insert(rows);

if (insertError) {
  throw insertError;
}

console.log(`Stored chunks: ${rows.length}/${allChunks.length}`);

      // Remove local repository
      await fs.promises.rm(repoPath, {
        recursive: true,
        force: true,
      });

      console.log("Local repository removed");

      // Mark job as completed
      const { error: completedError } = await supabaseAdmin
        .from("processing_jobs")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", job.sessionId);

      if (completedError) {
        throw completedError;
      }

      console.log("Job status: completed");

      // Delete SQS message only after successful processing
      await deleteJob(message.ReceiptHandle);

      console.log("Job completed and deleted from queue");
    } catch (err) {
      console.error("Job processing failed:", err);

      // Mark job as failed
      if (job?.sessionId) {
        const { error: failedError } = await supabaseAdmin
          .from("processing_jobs")
          .update({
            status: "failed",
            error: err.message || "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("session_id", job.sessionId);

        if (failedError) {
          console.error("Failed to update job status:", failedError);
        }
      }

      console.log("Job marked as failed");
    }
  }
} 

startWorker();
