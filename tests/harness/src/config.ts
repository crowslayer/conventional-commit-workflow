import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

export const LLMBackendSchema = z.enum(["mock", "ollama", "anthropic", "openai"]);
export type LLMBackend = z.infer<typeof LLMBackendSchema>;

export interface HarnessConfig {
  backend: LLMBackend;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  mcpServerPath: string;
  repositoryPath?: string;
  ollamaBaseUrl: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  systemPromptPath: string;
  scenariosDir: string;
  resultsDir: string;
  verbose: boolean;
}

export function loadConfig(): HarnessConfig {
  const backend = (process.env.LLM_BACKEND || "mock") as LLMBackend;
  LLMBackendSchema.parse(backend);

  const defaults: Record<LLMBackend, { model: string; temperature: number }> = {
    mock: { model: "mock-v1", temperature: 0 },
    ollama: { model: "llama3.2", temperature: 0 },
    anthropic: { model: "claude-3-5-sonnet-20241022", temperature: 0 },
    openai: { model: "gpt-4o", temperature: 0 },
  };

  const backendDefaults = defaults[backend];

  const __filename = fileURLToPath(import.meta.url);
  const baseDir = dirname(__filename);

  return {
    backend,
    model: process.env.LLM_MODEL || backendDefaults.model,
    temperature: parseFloat(process.env.LLM_TEMPERATURE || String(backendDefaults.temperature)),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || "4096", 10),
    timeoutMs: parseInt(process.env.HARNESS_TIMEOUT_MS || "60000", 10),
    mcpServerPath: process.env.MCP_SERVER_PATH || resolve(baseDir, "../../../mcp_server"),
    repositoryPath: process.env.REPOSITORY_PATH,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    systemPromptPath: process.env.SYSTEM_PROMPT_PATH || resolve(baseDir, "../../../skills/v2.0.0/system_prompt.md"),
    scenariosDir: process.env.SCENARIOS_DIR || resolve(baseDir, "../../scenarios"),
    resultsDir: process.env.RESULTS_DIR || resolve(baseDir, "../../results"),
    verbose: process.env.VERBOSE === "true",
  };
}

export function validateConfig(config: HarnessConfig): void {
  if (config.backend === "anthropic" && !config.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for anthropic backend");
  }
  if (config.backend === "openai" && !config.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is required for openai backend");
  }
}
