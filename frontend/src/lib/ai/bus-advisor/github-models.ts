import { createOpenAI } from "@ai-sdk/openai";

const token = process.env.GITHUB_MODELS_TOKEN;

if (!token) {
  throw new Error("Missing GITHUB_MODELS_TOKEN");
}

export const githubModels = createOpenAI({
  name: "github-models",
  apiKey: token,
  baseURL: "https://models.github.ai/inference",
  headers: {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

export const busAdvisorChatModel = githubModels.chat(
  process.env.GITHUB_MODELS_CHAT_MODEL ?? "openai/gpt-4o-mini"
);

export const busAdvisorEmbeddingModel = githubModels.embedding(
  process.env.GITHUB_MODELS_EMBEDDING_MODEL ?? "openai/text-embedding-3-small"
);
