import { readFileSync } from "fs";
import { join } from "path";

export const prompts = [
  {
    name: "conventional_commit_workflow",
    description: "Full Conventional Commit Workflow skill (v2.0.0)",
    arguments: [
      {
        name: "mode",
        description: "Operating mode (analyze, prepare, validate, execute)",
        required: false,
      },
    ],
  },
];

export async function getPrompt(name: string, args?: any) {
  if (name !== "conventional_commit_workflow") {
    throw new Error(`Unknown prompt: ${name}`);
  }

  const skillPath = join(
    process.cwd(),
    "..",
    "skills",
    "v2.0.0",
    "system_prompt.md",
  );
  const skillContent = readFileSync(skillPath, "utf-8");

  let messages = [
    {
      role: "user" as const,
      content: {
        type: "text" as const,
        text: skillContent,
      },
    },
  ];

  if (args?.mode) {
    messages.push({
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `\n\nActivate mode: ${args.mode}`,
      },
    });
  }

  return { messages };
}
