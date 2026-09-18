import {
  SQSClient,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";

const sqs = new SQSClient({
  region: "ap-south-1",
});

const QUEUE_URL = "https://sqs.ap-south-1.amazonaws.com/042522012026/codebase-rag-processing";

export async function sendProcessingJob(job) {
  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(job),
  });

  return await sqs.send(command);
}
