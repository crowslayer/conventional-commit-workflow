import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { ScenarioResult } from "../llm/types.js";

export class JsonReporter {
  private resultsDir: string;

  constructor(resultsDir: string) {
    this.resultsDir = resultsDir;
    mkdirSync(this.resultsDir, { recursive: true });
  }

  generateReport(results: ScenarioResult[], timestamp: string): string {
    const report = {
      summary: {
        timestamp,
        total_scenarios: results.length,
        passed: results.filter((r) => r.passed).length,
        failed: results.filter((r) => !r.passed).length,
        total_duration_ms: results.reduce((sum, r) => sum + r.duration_ms, 0),
        total_tokens: results.reduce((sum, r) => sum + r.token_usage.total_tokens, 0),
        llm_backend: results[0]?.llm_backend || "unknown",
        llm_model: results[0]?.llm_model || "unknown",
      },
      results: results.map((r) => ({
        scenario_name: r.scenario_name,
        scenario_file: r.scenario_file,
        passed: r.passed,
        duration_ms: r.duration_ms,
        assertions: {
          total: r.assertions.length,
          passed: r.assertions.filter((a) => a.passed).length,
          failed: r.assertions.filter((a) => !a.passed).length,
          details: r.assertions,
        },
        tool_calls: {
          total: r.tool_calls.length,
          tools_used: Array.from(new Set(r.tool_calls.map((tc) => tc.name))),
        },
        token_usage: r.token_usage,
        error: r.error,
        final_response_preview: r.final_response.substring(0, 500),
      })),
    };

    const fileName = `eval-report-${timestamp.replace(/[:.]/g, "-")}.json`;
    const filePath = join(this.resultsDir, fileName);
    writeFileSync(filePath, JSON.stringify(report, null, 2));

    return filePath;
  }
}
