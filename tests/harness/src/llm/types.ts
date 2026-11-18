export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: string;
  timestamp: number;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface LLMResponse {
  content: string;
  tool_calls: ToolCall[];
  finish_reason: "stop" | "tool_use" | "length" | "error";
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  raw_response?: any;
}

export interface LLMClient {
  name: string;
  model: string;

  // Sends a message and gets a response. If tools are available,
  // the LLM may return tool_calls that need to be executed.
  chat(messages: LLMMessage[], tools?: ToolDefinition[]): Promise<LLMResponse>;

  // Closes any open connections
  close(): Promise<void>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ScenarioResult {
  scenario_name: string;
  scenario_file: string;
  passed: boolean;
  duration_ms: number;
  llm_backend: string;
  llm_model: string;
  messages: LLMMessage[];
  tool_calls: ToolCall[];
  assertions: AssertionResult[];
  final_response: string;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
  metadata: Record<string, any>;
}

export interface AssertionResult {
  type: string;
  description: string;
  passed: boolean;
  evidence: string;
  details?: any;
}

export interface Scenario {
  name: string;
  description: string;
  fixture: string;
  setup_steps?: string[];
  user_request: string;
  expected_behavior: {
    mode: string;
    mutations_allowed: boolean;
    expected_actions?: string[];
    forbidden_actions?: string[];
  };
  assertions: Array<{
    type: string;
    description: string;
  }>;
}
