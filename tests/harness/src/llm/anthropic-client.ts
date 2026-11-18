import Anthropic from "@anthropic-ai/sdk";
import { LLMClient, LLMMessage, LLMResponse, ToolCall, ToolDefinition } from "./types.js";

export class AnthropicClient implements LLMClient {
  name = "anthropic";
  model: string;

  private client: Anthropic;
  private temperature: number;
  private maxTokens: number;

  constructor(apiKey: string, model: string, temperature: number = 0, maxTokens: number = 4096) {
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.client = new Anthropic({ apiKey });
  }

  async chat(messages: LLMMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    // Convert messages to Anthropic format
    const anthropicMessages = this.convertMessages(messages);

    // Convert tools to Anthropic format
    const anthropicTools = tools?.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));

    // Extract system message if present
    let systemMessage: string | undefined;
    if (anthropicMessages.length > 0 && anthropicMessages[0].role === "system") {
      systemMessage = anthropicMessages[0].content as string;
      anthropicMessages.shift();
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemMessage,
        messages: anthropicMessages as Anthropic.MessageParam[],
        tools: anthropicTools,
      });

      // Parse response
      let content = "";
      const toolCalls: ToolCall[] = [];

      for (const block of response.content) {
        if (block.type === "text") {
          content += block.text;
        } else if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input as Record<string, any>,
            timestamp: Date.now(),
          });
        }
      }

      return {
        content,
        tool_calls: toolCalls,
        finish_reason: response.stop_reason === "end_turn" ? "stop" : response.stop_reason === "tool_use" ? "tool_use" : "stop",
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        raw_response: response,
      };
    } catch (error: any) {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  private convertMessages(messages: LLMMessage[]): any[] {
    return messages.map((msg) => {
      if (msg.role === "tool") {
        return {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: msg.tool_call_id,
              content: msg.content,
            },
          ],
        };
      }

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const content: any[] = [];
        if (msg.content) {
          content.push({ type: "text", text: msg.content });
        }
        for (const toolCall of msg.tool_calls) {
          content.push({
            type: "tool_use",
            id: toolCall.id,
            name: toolCall.name,
            input: toolCall.arguments,
          });
        }
        return {
          role: msg.role,
          content,
        };
      }

      return {
        role: msg.role,
        content: msg.content,
      };
    });
  }

  async close(): Promise<void> {}
}
