import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

export interface ConvertOptions {
  filter?: string;
}

/**
 * Convert LaTeX content to Markdown using Pandoc
 */
export async function convertToMarkdown(
  latexContent: string,
  options: ConvertOptions = {}
): Promise<string> {
  // Write latex to temp file
  const tempTex = join(tmpdir(), `texweave-${Date.now()}.tex`);
  await writeFile(tempTex, latexContent);
  
  // Build pandoc command
  const filterArg = options.filter ? `--lua-filter=${options.filter}` : '';
  const cmd = `pandoc ${tempTex} -f latex -t markdown ${filterArg}`;
  
  // Execute
  const { stdout, stderr } = await execAsync(cmd);
  if (stderr) console.error(stderr);
  
  return stdout;
}
