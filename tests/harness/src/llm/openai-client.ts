import OpenAI from "openai";
import { LLMClient, LLMMessage, LLMResponse, ToolCall, ToolDefinition } from "./types.js";

export class OpenAIClient implements LLMClient {
  name = "openai";
  model: string;

  private client: OpenAI;
  private temperature: number;
  private maxTokens: number;

  constructor(apiKey: string, model: string, temperature: number = 0, maxTokens: number = 4096) {
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.client = new OpenAI({ apiKey });
  }

  async chat(messages: LLMMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    // Convert messages to OpenAI format
    const openaiMessages = this.convertMessages(messages);

    // Convert tools to OpenAI format
    const openaiTools = tools?.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }));

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        tools: openaiTools,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error("No response from OpenAI");
      }

      const message = choice.message;
      const toolCalls: ToolCall[] = [];

      if (message.tool_calls) {
        for (const toolCall of message.tool_calls) {
          toolCalls.push({
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
            timestamp: Date.now(),
          });
        }
      }

      return {
        content: message.content || "",
        tool_calls: toolCalls,
        finish_reason: choice.finish_reason === "stop" ? "stop" : choice.finish_reason === "tool_calls" ? "tool_use" : "stop",
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        raw_response: response,
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  private convertMessages(messages: LLMMessage[]): OpenAI.ChatCompletionMessageParam[] {
    return messages.map((msg) => {
      if (msg.role === "tool") {
        return {
          role: "tool" as const,
          content: msg.content,
          tool_call_id: msg.tool_call_id!,
        };
      }

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        return {
          role: "assistant" as const,
          content: msg.content || null,
          tool_calls: msg.tool_calls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        };
      }

      return {
        role: msg.role as any,
        content: msg.content,
      };
    });
  }

  async close(): Promise<void> {
    // No cleanup needed for OpenAI client
  }
}
