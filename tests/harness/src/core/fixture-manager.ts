import { execFileSync } from "child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { platform } from "os";
import { isAbsolute, join, relative, resolve } from "path";

export class FixtureManager {
  private fixturesDir: string;
  private createdRepos: string[] = [];
  private shellCommand: string;
  private shellArgs: string[];

  constructor(fixturesDir: string) {
    this.fixturesDir = resolve(fixturesDir);
    const shellInfo = this.detectShell();
    this.shellCommand = shellInfo.command;
    this.shellArgs = shellInfo.args;
  }

  private detectShell(): { command: string; args: string[] } {
    const currentPlatform = platform();

    if (currentPlatform === "win32") {
      const gitBashPaths = [
        "C:\\Program Files\\Git\\bin\\bash.exe",
        "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
        `${process.env.PROGRAMFILES}\\Git\\bin\\bash.exe`,
        `${process.env["PROGRAMFILES(X86)"]}\\Git\\bin\\bash.exe`,
        `${process.env.LOCALAPPDATA}\\Programs\\Git\\bin\\bash.exe`,
      ];

      for (const bashPath of gitBashPaths) {
        if (bashPath && existsSync(bashPath)) {
          return { command: bashPath, args: ["-c"] };
        }
      }

      // Fallbacks si bash está en el PATH
      try {
        const { execSync } = require("child_process");
        execSync("bash --version", { stdio: "ignore" });
        return { command: "bash", args: ["-c"] };
      } catch {}

      try {
        const { execSync } = require("child_process");
        execSync("sh --version", { stdio: "ignore" });
        return { command: "sh", args: ["-c"] };
      } catch {}

      throw new Error(
        "Git Bash not found on Windows. Please install Git for Windows " +
          "(https://git-scm.com/download/win) or add Git's bin directory to your PATH.",
      );
    }

    return { command: "bash", args: ["-c"] };
  }

  async setup(fixtureName: string, testId: string): Promise<string> {
    this.validateSafeIdentifier(fixtureName, "fixtureName");
    this.validateSafeIdentifier(testId, "testId");

    const scriptPath = resolve(this.fixturesDir, `${fixtureName}.sh`);
    this.ensureInsideBase(this.fixturesDir, scriptPath);

    if (!existsSync(scriptPath)) {
      throw new Error(`Fixture script not found: ${scriptPath}`);
    }

    const testDir = resolve(this.fixturesDir, "..", `test-repo-${testId}`);

    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }

    const normalizedScriptPath = this.normalizePathForBash(scriptPath);
    const normalizedTestDir = this.normalizePathForBash(testDir);

    const env = {
      ...process.env,
      TEST_REPO_DIR: normalizedTestDir,
    };

    try {
      // ✅ CORRECCIÓN CLAVE: Pasar el ejecutable y los argumentos como array.
      // Node.js maneja automáticamente las comillas para paths con espacios en Windows.
      execFileSync(this.shellCommand, [...this.shellArgs, normalizedScriptPath], {
        cwd: this.fixturesDir,
        env,
        stdio: "pipe",
      });
    } catch (error: any) {
      const stderr = error.stderr?.toString() || "";
      const stdout = error.stdout?.toString() || "";
      throw new Error(
        `Fixture setup failed: ${error.message}\n` +
          `Shell: ${this.shellCommand}\n` +
          `Script: ${scriptPath}\n` +
          `Stdout: ${stdout}\n` +
          `Stderr: ${stderr}`,
      );
    }

    if (!existsSync(testDir)) {
      throw new Error(`Fixture script ran but did not create expected directory: ${testDir}`);
    }

    this.createdRepos.push(testDir);
    return testDir;
  }

  private normalizePathForBash(path: string): string {
    if (platform() !== "win32") {
      return path;
    }

    // 1. Convertir backslashes a forward slashes
    let normalized = path.replace(/\\/g, "/");

    // 2. Convertir letra de unidad: "C:/foo" → "/c/foo"
    const driveMatch = normalized.match(/^([A-Za-z]):\//);
    if (driveMatch) {
      normalized = `/${driveMatch[1].toLowerCase()}${normalized.substring(2)}`;
    }

    return normalized;
  }

  async cleanup(): Promise<void> {
    for (const repo of this.createdRepos) {
      if (existsSync(repo)) {
        try {
          rmSync(repo, { recursive: true, force: true });
        } catch (error) {
          console.warn(`Warning: Could not cleanup ${repo}`);
        }
      }
    }
    this.createdRepos = [];
  }

  async createMinimalRepo(testId: string): Promise<string> {
    const testDir = resolve(this.fixturesDir, "..", `test-repo-${testId}`);

    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }

    mkdirSync(testDir, { recursive: true });

    const gitCommands = ["git init", 'git config user.email "test@example.com"', 'git config user.name "Test User"'];

    for (const cmd of gitCommands) {
      execFileSync(this.shellCommand, [...this.shellArgs, cmd], {
        cwd: testDir,
        stdio: "pipe",
      });
    }

    writeFileSync(join(testDir, "README.md"), "# Test Repo\n");

    const addAndCommit = 'git add README.md && git commit -m "Initial commit"';

    execFileSync(this.shellCommand, [...this.shellArgs, addAndCommit], {
      cwd: testDir,
      stdio: "pipe",
    });

    this.createdRepos.push(testDir);
    return testDir;
  }

  private validateSafeIdentifier(input: string, label: string): void {
    const safePattern = /^[a-zA-Z0-9_-]+$/;
    if (!safePattern.test(input)) {
      throw new Error(`Invalid ${label}: "${input}". Only alphanumeric characters, hyphens, and underscores are allowed.`);
    }
  }

  private ensureInsideBase(baseDir: string, targetPath: string): void {
    const rel = relative(baseDir, targetPath);
    if (rel.startsWith("..") || isAbsolute(rel)) {
      throw new Error(`Security violation: Path traversal detected for ${targetPath}`);
    }
  }
}
