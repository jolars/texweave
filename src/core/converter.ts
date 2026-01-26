import { exec } from "child_process";
import { promisify } from "util";
import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);

// Get the directory where this module is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ConvertOptions {
  filter?: string;
}

/**
 * Convert LaTeX content to Markdown using Pandoc
 */
export async function convertToMarkdown(
  latexContent: string,
  options: ConvertOptions = {},
): Promise<string> {
  // Write latex to temp file
  const tempTex = join(tmpdir(), `texweave-${Date.now()}.tex`);
  await writeFile(tempTex, latexContent);

  // Always apply bundled code-classes filter, plus any user-specified filter
  const bundledFilter = join(__dirname, "../../filters/code-classes.lua");
  const filters = [bundledFilter];
  if (options.filter) {
    filters.push(options.filter);
  }

  const filterArgs = filters.map((f) => `--lua-filter="${f}"`).join(" ");
  const cmd = `pandoc ${tempTex} -f latex -t markdown ${filterArgs}`;

  // Execute
  const { stdout, stderr } = await execAsync(cmd);
  if (stderr) console.error(stderr);

  return stdout;
}
