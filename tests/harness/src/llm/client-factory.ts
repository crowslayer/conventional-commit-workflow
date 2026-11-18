import { HarnessConfig } from "../config.js";
import { AnthropicClient } from "./anthropic-client.js";
import { MockLLMClient } from "./mock-client.js";
import { OllamaClient } from "./ollama-client.js";
import { OpenAIClient } from "./openai-client.js";
import { LLMClient } from "./types.js";

export function createLLMClient(config: HarnessConfig): LLMClient {
  switch (config.backend) {
    case "mock":
      return new MockLLMClient(config.scenariosDir);

    case "ollama":
      return new OllamaClient(config.model, config.ollamaBaseUrl);

    case "anthropic":
      if (!config.anthropicApiKey) {
        throw new Error("ANTHROPIC_API_KEY is required for anthropic backend");
      }
      return new AnthropicClient(config.anthropicApiKey, config.model, config.temperature, config.maxTokens);

    case "openai":
      if (!config.openaiApiKey) {
        throw new Error("OPENAI_API_KEY is required for openai backend");
      }
      return new OpenAIClient(config.openaiApiKey, config.model, config.temperature, config.maxTokens);

    default:
      throw new Error(`Unknown LLM backend: ${config.backend}`);
  }
}
