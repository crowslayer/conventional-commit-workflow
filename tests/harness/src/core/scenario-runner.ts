import { readFileSync } from "fs";
import { join } from "path";
import { HarnessConfig } from "../config.js";
import { createLLMClient } from "../llm/client-factory.js";
import { MockLLMClient } from "../llm/mock-client.js";
import { LLMMessage, Scenario, ScenarioResult, ToolCall } from "../llm/types.js";
import { MCPClient } from "../mcp/client.js";
import { AssertionEvaluator } from "./assertion-evaluator.js";
import { FixtureManager } from "./fixture-manager.js";

export class ScenarioRunner {
  private config: HarnessConfig;
  private fixtureManager: FixtureManager;
  private assertionEvaluator: AssertionEvaluator;

  constructor(config: HarnessConfig) {
    this.config = config;
    this.fixtureManager = new FixtureManager(join(config.scenariosDir, "..", "fixtures"));
    this.assertionEvaluator = new AssertionEvaluator();
  }

  async run(scenarioFile: string): Promise<ScenarioResult> {
    const startTime = Date.now();
    const scenarioName = scenarioFile.replace(/\.json$/, "");
    const testId = `${scenarioName}_${Date.now()}`;

    let scenario: Scenario;
    let repositoryPath: string;
    let mcpClient: MCPClient | null = null;

    try {
      // Load scenario
      const scenarioPath = join(this.config.scenariosDir, scenarioFile);
      scenario = JSON.parse(readFileSync(scenarioPath, "utf-8"));

      if (this.config.verbose) {
        console.log(`\n[Scenario] ${scenario.name}`);
        console.log(`  Description: ${scenario.description}`);
      }

      // Setup fixture
      repositoryPath = await this.fixtureManager.setup(scenario.fixture, testId);

      if (this.config.verbose) {
        console.log(`  Repository: ${repositoryPath}`);
      }

      // Start MCP server
      mcpClient = new MCPClient(this.config.mcpServerPath, repositoryPath);
      await mcpClient.start();

      // Get available tools
      const tools = await mcpClient.listTools();

      if (this.config.verbose) {
        console.log(`  Tools available: ${tools.length}`);
      }

      // Create LLM client
      const llmClient = createLLMClient(this.config);

      // Load scenario into mock client if applicable
      if (llmClient instanceof MockLLMClient) {
        llmClient.loadScenario(scenarioName);
      }

      // Load system prompt
      const systemPrompt = readFileSync(this.config.systemPromptPath, "utf-8");

      // Build initial messages
      const messages: LLMMessage[] = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: scenario.user_request,
        },
      ];

      // Run conversation loop
      const allToolCalls: ToolCall[] = [];
      let finalResponse = "";
      let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      let iteration = 0;
      const maxIterations = 10;

      while (iteration < maxIterations) {
        iteration++;

        if (this.config.verbose) {
          console.log(`  [Iteration ${iteration}] Sending ${messages.length} messages to LLM`);
        }

        const response = await llmClient.chat(messages, tools);

        // Accumulate usage
        totalUsage.prompt_tokens += response.usage.prompt_tokens;
        totalUsage.completion_tokens += response.usage.completion_tokens;
        totalUsage.total_tokens += response.usage.total_tokens;

        // Add assistant message to history
        messages.push({
          role: "assistant",
          content: response.content,
          tool_calls: response.tool_calls.length > 0 ? response.tool_calls : undefined,
        });

        // If no tool calls, we're done
        if (response.tool_calls.length === 0) {
          finalResponse = response.content;
          break;
        }

        // Execute tool calls
        for (const toolCall of response.tool_calls) {
          if (this.config.verbose) {
            console.log(`    [Tool] ${toolCall.name}(${JSON.stringify(toolCall.arguments)})`);
          }

          const result = await mcpClient.callTool(toolCall.name, toolCall.arguments);
          allToolCalls.push({
            id: toolCall.id,
            name: result.name,
            arguments: result.arguments,
            result: result.result,
            timestamp: Date.now(),
          });

          if (this.config.verbose) {
            console.log(`    [Result] ${result.result.substring(0, 100)}...`);
          }

          // Add tool result to messages
          messages.push({
            role: "tool",
            content: result.result,
            tool_call_id: toolCall.id,
          });
        }

        // Check if LLM wants to stop
        if (response.finish_reason === "stop") {
          finalResponse = response.content;
          break;
        }
      }

      if (iteration >= maxIterations) {
        console.warn(`  Warning: Max iterations reached for ${scenarioName}`);
      }

      // Evaluate assertions
      const assertionResults = this.assertionEvaluator.evaluate(scenario, allToolCalls, finalResponse, messages);

      const allPassed = assertionResults.every((r) => r.passed);
      const duration = Date.now() - startTime;

      if (this.config.verbose) {
        console.log(`  [Result] ${allPassed ? "✓ PASSED" : "✗ FAILED"} (${duration}ms)`);
        console.log(`  [Assertions] ${assertionResults.filter((r) => r.passed).length}/${assertionResults.length} passed`);
      }

      return {
        scenario_name: scenario.name,
        scenario_file: scenarioFile,
        passed: allPassed,
        duration_ms: duration,
        llm_backend: this.config.backend,
        llm_model: this.config.model,
        messages,
        tool_calls: allToolCalls,
        assertions: assertionResults,
        final_response: finalResponse,
        token_usage: totalUsage,
        metadata: {
          iterations: iteration,
          tools_available: tools.length,
          tools_used: allToolCalls.length,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (this.config.verbose) {
        console.error(`  [Error] ${error.message}`);
      }

      return {
        scenario_name: scenarioName,
        scenario_file: scenarioFile,
        passed: false,
        duration_ms: duration,
        llm_backend: this.config.backend,
        llm_model: this.config.model,
        messages: [],
        tool_calls: [],
        assertions: [],
        final_response: "",
        token_usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        error: error.message,
        metadata: {},
      };
    } finally {
      // Cleanup
      if (mcpClient) {
        await mcpClient.stop();
      }
      await this.fixtureManager.cleanup();
    }
  }
}
