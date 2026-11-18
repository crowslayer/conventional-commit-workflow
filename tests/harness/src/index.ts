#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { readdirSync } from "fs";
import { loadConfig, validateConfig } from "./config.js";
import { ScenarioRunner } from "./core/scenario-runner.js";
import { HtmlReporter } from "./reporting/html-reporter.js";
import { JsonReporter } from "./reporting/json-reporter.js";

const program = new Command();

program.name("eval-harness").description("Test harness for evaluating the Conventional Commit Workflow agent").version("2.4.0");

program
  .command("run")
  .description("Run all evaluation scenarios")
  .option("-s, --scenario <name>", "Run specific scenario")
  .option("-b, --backend <backend>", "LLM backend (mock, ollama, anthropic, openai)")
  .option("-m, --model <model>", "LLM model name")
  .option("-v, --verbose", "Verbose output")
  .option("--json-only", "Generate only JSON report")
  .option("--html-only", "Generate only HTML report")
  .action(async (options) => {
    try {
      const config = loadConfig();

      // Override config with CLI options
      if (options.backend) config.backend = options.backend as any;
      if (options.model) config.model = options.model;
      if (options.verbose) config.verbose = true;

      validateConfig(config);

      console.log(chalk.blue("\n🧪 Conventional Commit Workflow - Test Harness"));
      console.log(chalk.gray(`Backend: ${config.backend}`));
      console.log(chalk.gray(`Model: ${config.model}`));
      console.log(chalk.gray(`Scenarios: ${config.scenariosDir}\n`));

      const runner = new ScenarioRunner(config);
      const jsonReporter = new JsonReporter(config.resultsDir);
      const htmlReporter = new HtmlReporter(config.resultsDir);

      // Load scenarios
      let scenarioFiles: string[];
      if (options.scenario) {
        scenarioFiles = [`${options.scenario}.json`];
      } else {
        scenarioFiles = readdirSync(config.scenariosDir)
          .filter((f) => f.endsWith(".json"))
          .sort();
      }

      if (scenarioFiles.length === 0) {
        console.log(chalk.yellow("No scenarios found."));
        process.exit(0);
      }

      console.log(chalk.blue(`Running ${scenarioFiles.length} scenario(s)...\n`));

      // Run scenarios
      const results = [];
      for (const scenarioFile of scenarioFiles) {
        const result = await runner.run(scenarioFile);
        results.push(result);

        const status = result.passed ? chalk.green("✓ PASSED") : chalk.red("✗ FAILED");
        const duration = chalk.gray(`(${(result.duration_ms / 1000).toFixed(2)}s)`);
        console.log(`  ${status} ${result.scenario_name} ${duration}`);
      }

      // Generate reports
      const timestamp = new Date().toISOString();
      const reportFiles: string[] = [];

      if (!options.htmlOnly) {
        const jsonPath = jsonReporter.generateReport(results, timestamp);
        reportFiles.push(jsonPath);
        if (!options.jsonOnly) {
          console.log(chalk.gray(`\n📄 JSON report: ${jsonPath}`));
        }
      }

      if (!options.jsonOnly) {
        const htmlPath = htmlReporter.generateReport(results, timestamp);
        reportFiles.push(htmlPath);
        console.log(chalk.gray(`📊 HTML report: ${htmlPath}`));
      }

      // Summary
      const passed = results.filter((r) => r.passed).length;
      const failed = results.filter((r) => !r.passed).length;
      const totalTokens = results.reduce((sum, r) => sum + r.token_usage.total_tokens, 0);

      console.log(chalk.blue("\n📊 Summary"));
      console.log(`  Total: ${results.length}`);
      console.log(chalk.green(`  Passed: ${passed}`));
      if (failed > 0) {
        console.log(chalk.red(`  Failed: ${failed}`));
      }
      console.log(chalk.gray(`  Tokens: ${totalTokens.toLocaleString()}`));

      // Exit with error if any failed
      if (failed > 0) {
        console.log(chalk.red("\n❌ Some scenarios failed."));
        process.exit(1);
      } else {
        console.log(chalk.green("\n✅ All scenarios passed!"));
        process.exit(0);
      }
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List available scenarios")
  .action(() => {
    const config = loadConfig();
    const scenarioFiles = readdirSync(config.scenariosDir)
      .filter((f) => f.endsWith(".json"))
      .sort();

    console.log(chalk.blue("\n📋 Available Scenarios\n"));
    scenarioFiles.forEach((f) => {
      console.log(`  • ${f.replace(".json", "")}`);
    });
    console.log();
  });

program
  .command("backends")
  .description("List available LLM backends")
  .action(() => {
    console.log(chalk.blue("\n🔌 Available LLM Backends\n"));
    console.log("  • mock       - Mock client for CI (no cost, fast)");
    console.log("  • ollama     - Ollama local models (no cost, requires Ollama)");
    console.log("  • anthropic  - Claude API (requires ANTHROPIC_API_KEY)");
    console.log("  • openai     - GPT-4 API (requires OPENAI_API_KEY)");
    console.log();
  });

program.parse();
