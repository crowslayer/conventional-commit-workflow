import { ChildProcess, spawn } from "child_process";
import { join } from "path";
import { ToolDefinition } from "../llm/types.js";

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
  result: string;
  isError: boolean;
  duration_ms: number;
}

export class MCPClient {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
    }
  >();
  private buffer = "";
  private serverPath: string;
  private repositoryPath: string;

  constructor(serverPath: string, repositoryPath: string) {
    this.serverPath = serverPath;
    this.repositoryPath = repositoryPath;
  }

  async start(): Promise<void> {
    const serverEntry = join(this.serverPath, "dist", "index.js");

    this.process = spawn("node", [serverEntry], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: this.serverPath,
    });

    this.process.stdout?.on("data", (data) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    this.process.stderr?.on("data", (data) => {
      console.error(`[MCP Server] ${data.toString().trim()}`);
    });

    this.process.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`MCP server exited with code ${code}`);
      }
    });

    // Wait for server to be ready
    await this.initialize();
  }

  private processBuffer(): void {
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const message = JSON.parse(line);
        this.handleMessage(message);
      } catch (error) {
        console.error("Failed to parse MCP message:", line);
      }
    }
  }

  private handleMessage(message: any): void {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message || "Unknown MCP error"));
      } else {
        resolve(message.result);
      }
    }
  }

  private async initialize(): Promise<void> {
    // Send initialize request
    await this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-harness",
        version: "2.4.0",
      },
    });

    // Send initialized notification
    this.sendNotification("notifications/initialized", {});
  }

  private sendRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pendingRequests.set(id, { resolve, reject });

      const message = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      this.process?.stdin?.write(JSON.stringify(message) + "\n");

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  private sendNotification(method: string, params: any): void {
    const message = {
      jsonrpc: "2.0",
      method,
      params,
    };
    this.process?.stdin?.write(JSON.stringify(message) + "\n");
  }

  async listTools(): Promise<ToolDefinition[]> {
    const result = await this.sendRequest("tools/list", {});
    return result.tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));
  }

  async callTool(name: string, args: Record<string, any>): Promise<MCPToolCall> {
    const startTime = Date.now();

    // Inject repository_path if not present
    const enrichedArgs = { ...args };
    if (!enrichedArgs.repository_path && !enrichedArgs.path && !enrichedArgs.cwd) {
      enrichedArgs.repository_path = this.repositoryPath;
    }

    try {
      const result = await this.sendRequest("tools/call", {
        name,
        arguments: enrichedArgs,
      });

      const duration = Date.now() - startTime;
      const content = result.content?.[0]?.text || "";
      const isError = result.isError || false;

      return {
        name,
        arguments: enrichedArgs,
        result: content,
        isError,
        duration_ms: duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        name,
        arguments: enrichedArgs,
        result: `Error: ${error.message}`,
        isError: true,
        duration_ms: duration,
      };
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
