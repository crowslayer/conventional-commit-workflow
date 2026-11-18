import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { ScenarioResult } from "../llm/types.js";

export class HtmlReporter {
  private resultsDir: string;

  constructor(resultsDir: string) {
    this.resultsDir = resultsDir;
    mkdirSync(this.resultsDir, { recursive: true });
  }

  generateReport(results: ScenarioResult[], timestamp: string): string {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration_ms, 0);
    const totalTokens = results.reduce((sum, r) => sum + r.token_usage.total_tokens, 0);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Eval Report - ${timestamp}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #2c3e50; margin-bottom: 10px; }
    .timestamp { color: #7f8c8d; font-size: 14px; margin-bottom: 30px; }
    .summary {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 15px;
    }
    .stat {
      text-align: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    .stat-value { font-size: 32px; font-weight: bold; color: #2c3e50; }
    .stat-label { font-size: 14px; color: #7f8c8d; margin-top: 5px; }
    .stat.passed .stat-value { color: #27ae60; }
    .stat.failed .stat-value { color: #e74c3c; }
    .scenario {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .scenario-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 2px solid #ecf0f1;
    }
    .scenario-title { font-size: 18px; font-weight: 600; color: #2c3e50; }
    .badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge.passed { background: #d4edda; color: #155724; }
    .badge.failed { background: #f8d7da; color: #721c24; }
    .scenario-meta {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: #7f8c8d;
      margin-bottom: 15px;
    }
    .assertions { margin-top: 15px; }
    .assertion {
      padding: 10px;
      margin-bottom: 8px;
      border-radius: 4px;
      border-left: 4px solid;
    }
    .assertion.passed { background: #d4edda; border-color: #27ae60; }
    .assertion.failed { background: #f8d7da; border-color: #e74c3c; }
    .assertion-header { font-weight: 600; margin-bottom: 5px; }
    .assertion-evidence { font-size: 13px; color: #555; }
    .tool-calls { margin-top: 15px; }
    .tool-call {
      background: #f8f9fa;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 5px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }
    .error {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin-top: 15px;
      border-radius: 4px;
    }
    .response-preview {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      margin-top: 15px;
      font-size: 13px;
      max-height: 200px;
      overflow-y: auto;
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Eval Report</h1>
    <div class="timestamp">Generated: ${timestamp}</div>

    <div class="summary">
      <h2>Summary</h2>
      <div class="summary-grid">
        <div class="stat">
          <div class="stat-value">${results.length}</div>
          <div class="stat-label">Total Scenarios</div>
        </div>
        <div class="stat passed">
          <div class="stat-value">${passed}</div>
          <div class="stat-label">Passed</div>
        </div>
        <div class="stat failed">
          <div class="stat-value">${failed}</div>
          <div class="stat-label">Failed</div>
        </div>
        <div class="stat">
          <div class="stat-value">${(totalDuration / 1000).toFixed(2)}s</div>
          <div class="stat-label">Total Duration</div>
        </div>
        <div class="stat">
          <div class="stat-value">${totalTokens.toLocaleString()}</div>
          <div class="stat-label">Total Tokens</div>
        </div>
        <div class="stat">
          <div class="stat-value">${results[0]?.llm_backend || "N/A"}</div>
          <div class="stat-label">LLM Backend</div>
        </div>
      </div>
    </div>

    ${results.map((r) => this.renderScenario(r)).join("")}
  </div>
</body>
</html>`;

    const fileName = `eval-report-${timestamp.replace(/[:.]/g, "-")}.html`;
    const filePath = join(this.resultsDir, fileName);
    writeFileSync(filePath, html);

    return filePath;
  }

  private renderScenario(result: ScenarioResult): string {
    const assertionsHtml = result.assertions
      .map(
        (a) => `
      <div class="assertion ${a.passed ? "passed" : "failed"}">
        <div class="assertion-header">${a.passed ? "✓" : "✗"} ${a.description}</div>
        <div class="assertion-evidence">${a.evidence}</div>
      </div>
    `,
      )
      .join("");

    const toolCallsHtml =
      result.tool_calls.length > 0
        ? `
      <div class="tool-calls">
        <h4>Tool Calls (${result.tool_calls.length})</h4>
        ${result.tool_calls
          .map(
            (tc) => `
          <div class="tool-call">
            <strong>${tc.name}</strong>(${JSON.stringify(tc.arguments)})
          </div>
        `,
          )
          .join("")}
      </div>
    `
        : "";

    const errorHtml = result.error
      ? `
      <div class="error">
        <strong>Error:</strong> ${result.error}
      </div>
    `
      : "";

    const responseHtml = result.final_response
      ? `
      <div class="response-preview">
        <strong>Final Response:</strong><br>
        ${result.final_response}
      </div>
    `
      : "";

    return `
      <div class="scenario">
        <div class="scenario-header">
          <div class="scenario-title">${result.scenario_name}</div>
          <span class="badge ${result.passed ? "passed" : "failed"}">
            ${result.passed ? "Passed" : "Failed"}
          </span>
        </div>
        <div class="scenario-meta">
          <span>Duration: ${(result.duration_ms / 1000).toFixed(2)}s</span>
          <span>Tokens: ${result.token_usage.total_tokens.toLocaleString()}</span>
          <span>Assertions: ${result.assertions.filter((a) => a.passed).length}/${result.assertions.length}</span>
        </div>
        <div class="assertions">
          <h4>Assertions</h4>
          ${assertionsHtml}
        </div>
        ${toolCallsHtml}
        ${errorHtml}
        ${responseHtml}
      </div>
    `;
  }
}
