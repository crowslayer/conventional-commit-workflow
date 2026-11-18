import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { LLMClient, LLMMessage, LLMResponse, Scenario, ToolCall, ToolDefinition } from "./types.js";

export class MockLLMClient implements LLMClient {
  name = "mock";
  model = "mock-v1";

  private scenarioResponses: Map<string, MockResponse> = new Map();
  private currentScenario: string | null = null;
  private callIndex: number = 0;
  private toolResults: Map<string, string> = new Map();

  constructor(private scenariosDir: string) {}

  loadScenario(scenarioName: string): void {
    this.currentScenario = scenarioName;
    this.callIndex = 0;
    this.scenarioResponses.clear();
    this.toolResults.clear();

    const scenarioPath = join(this.scenariosDir, `${scenarioName}.json`);
    if (existsSync(scenarioPath)) {
      try {
        const scenario: Scenario & { mock_responses?: MockResponse[] } = JSON.parse(readFileSync(scenarioPath, "utf-8"));

        if (scenario.mock_responses) {
          scenario.mock_responses.forEach((resp, idx) => {
            this.scenarioResponses.set(String(idx), resp);
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not load mock responses for ${scenarioName}`);
      }
    }
  }

  async chat(messages: LLMMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    const responseKey = String(this.callIndex);
    const mockResponse = this.scenarioResponses.get(responseKey);

    this.callIndex++;

    // Si hay una respuesta mock predefinida, usarla
    if (mockResponse) {
      return {
        content: mockResponse.content || "",
        tool_calls: mockResponse.tool_calls || [],
        finish_reason: mockResponse.finish_reason || "stop",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
        raw_response: mockResponse,
      };
    }

    // Analizar los mensajes para entender el contexto
    const lastMessage = messages[messages.length - 1];
    const userRequest = lastMessage?.content || "";

    // Recopilar resultados de herramientas de los mensajes anteriores
    this.collectToolResults(messages);

    // LÓGICA INTELIGENTE: Detectar estados peligrosos del repositorio
    if (this.isDangerousState()) {
      return {
        content:
          " **Dangerous Repository State Detected**\n\n" +
          "The repository is currently in a **merge conflict state** (unresolved conflicts detected).\n\n" +
          "**Current state:**\n" +
          "- Unresolved merge conflicts in: file.txt\n" +
          "- Cannot safely proceed with commit operations\n\n" +
          "**Recommendation:**\n" +
          "Please resolve the merge conflicts manually first, or let me know how you'd like to proceed:\n" +
          "1. Resolve conflicts manually and then continue\n" +
          "2. Abort the merge with `git merge --abort`\n" +
          "3. Provide specific instructions for conflict resolution\n\n" +
          "How would you like to proceed?",
        tool_calls: [],
        finish_reason: "stop",
        usage: {
          prompt_tokens: 150,
          completion_tokens: 100,
          total_tokens: 250,
        },
      };
    }

    // Lógica para requests de análisis
    if (userRequest.includes("analyze") || userRequest.includes("review")) {
      return {
        content: "I'll analyze the Git changes for you.",
        tool_calls: [
          {
            id: `mock_${Date.now()}_1`,
            name: "git_status",
            arguments: {},
            timestamp: Date.now(),
          },
          {
            id: `mock_${Date.now()}_2`,
            name: "git_diff",
            arguments: { staged: false },
            timestamp: Date.now(),
          },
        ],
        finish_reason: "tool_use",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };
    }

    // Lógica para requests de commit
    if (userRequest.includes("commit") || userRequest.includes("prepare")) {
      return {
        content: "I'll prepare commit proposals based on the changes.",
        tool_calls: [
          {
            id: `mock_${Date.now()}_1`,
            name: "git_status",
            arguments: {},
            timestamp: Date.now(),
          },
          {
            id: `mock_${Date.now()}_2`,
            name: "analyze_commit_groupings",
            arguments: { strategy: "hybrid" },
            timestamp: Date.now(),
          },
        ],
        finish_reason: "tool_use",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };
    }

    // Respuesta por defecto
    return {
      content: "Mock response: I understand your request.",
      tool_calls: [],
      finish_reason: "stop",
      usage: {
        prompt_tokens: 100,
        completion_tokens: 20,
        total_tokens: 120,
      },
    };
  }

  private collectToolResults(messages: LLMMessage[]): void {
    for (const msg of messages) {
      if (msg.role === "tool" && msg.tool_call_id) {
        this.toolResults.set(msg.tool_call_id, msg.content);
      }
    }
  }

  private isDangerousState(): boolean {
    // Buscar en los resultados de git_status patrones de estado peligroso
    for (const [toolCallId, result] of this.toolResults) {
      // AA = both modified (merge conflict)
      // UU = unmerged
      // DD = both deleted
      // AU = added by us
      // UA = added by them
      // DU = deleted by us
      // UD = deleted by them
      const dangerousPatterns = /^(AA|UU|DD|AU|UA|DU|UD)\s+/m;

      if (dangerousPatterns.test(result)) {
        return true;
      }

      // También detectar mensajes de merge/rebase en progreso
      if (result.includes("merge conflict") || result.includes("rebase in progress") || result.includes("cherry-pick in progress")) {
        return true;
      }
    }

    return false;
  }

  async close(): Promise<void> {
    // No cleanup needed for mock
  }
}

interface MockResponse {
  content?: string;
  tool_calls?: ToolCall[];
  finish_reason?: "stop" | "tool_use" | "length" | "error";
}
