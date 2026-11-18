import { LLMClient, LLMMessage, LLMResponse, ToolCall, ToolDefinition } from "./types.js";

export class OllamaClient implements LLMClient {
  name = "ollama";
  model: string;

  private baseUrl: string;
  private abortController: AbortController | null = null;

  constructor(model: string, baseUrl: string = "http://localhost:11434") {
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async chat(messages: LLMMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    this.abortController = new AbortController();

    try {
      // Convert messages to Ollama format
      const ollamaMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Ollama doesn't have native tool use in the same way as OpenAI/Anthropic
      // We'll include tool definitions in the system message if available
      let systemPrompt = "";
      if (tools && tools.length > 0) {
        systemPrompt = `\n\nAvailable tools (use JSON format to call):\n${JSON.stringify(tools, null, 2)}`;
      }

      if (ollamaMessages[0]?.role === "system") {
        ollamaMessages[0].content += systemPrompt;
      } else {
        ollamaMessages.unshift({
          role: "system",
          content: `You are a helpful assistant.${systemPrompt}`,
        });
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: ollamaMessages,
          stream: false,
          options: {
            temperature: 0,
          },
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.message?.content || "";

      // Try to parse tool calls from the response (Ollama doesn't have native tool use)
      const toolCalls = this.extractToolCalls(content);

      return {
        content: toolCalls.length > 0 ? "" : content,
        tool_calls: toolCalls,
        finish_reason: toolCalls.length > 0 ? "tool_use" : "stop",
        usage: {
          prompt_tokens: data.prompt_eval_count || 0,
          completion_tokens: data.eval_count || 0,
          total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        raw_response: data,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  }

  private extractToolCalls(content: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];

    // Try to find JSON tool calls in the content
    const jsonPattern = /```json\s*([\s\S]*?)\s*```/g;
    let match;

    while ((match = jsonPattern.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);

        // Check if it looks like a tool call
        if (parsed.name && parsed.arguments) {
          toolCalls.push({
            id: `ollama_${Date.now()}_${toolCalls.length}`,
            name: parsed.name,
            arguments: parsed.arguments,
            timestamp: Date.now(),
          });
        }
      } catch {
        // Not valid JSON, skip
      }
    }

    return toolCalls;
  }

  async close(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
