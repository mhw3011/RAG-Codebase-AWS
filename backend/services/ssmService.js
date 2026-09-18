import {
  SSMClient,
  GetParametersCommand
} from "@aws-sdk/client-ssm";

const ssm = new SSMClient({
  region: "ap-south-1"
});

export async function loadSecrets() {
  const command = new GetParametersCommand({
    Names: [
      "/codebase-rag/OPENAI_API_KEY",
      "/codebase-rag/SUPABASE_URL",
      "/codebase-rag/SUPABASE_ANON_KEY",
      "/codebase-rag/SUPABASE_SERVICE_ROLE_KEY"
    ],
    WithDecryption: true
  });

  const response = await ssm.send(command);

  for (const parameter of response.Parameters) {
    const name = parameter.Name.split("/").pop();
    process.env[name] = parameter.Value;
  }

  console.log("Secrets loaded from SSM");
}
