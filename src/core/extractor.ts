import { readFile } from "fs/promises";

interface ExtractOptions {
  skipUntilPackage?: boolean;
  extractMacroNames?: boolean;
}

/**
 * Extract documentation from a DTX file to intermediate LaTeX format
 */
export async function extractDTX(
  filePath: string,
  options: ExtractOptions = {},
): Promise<string> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");

  let skipUntilPackage = options.skipUntilPackage ?? true;
  let inMacrocode = false;
  let inMacroEnv = false;

  const output: string[] = [];
  const codeLines: string[] = [];

  for (const line of lines) {
    // Skip until package start guard
    if (skipUntilPackage) {
      if (line.match(/^%<.*package>/)) {
        skipUntilPackage = false;
      }
      continue;
    }

    // Skip docstrip guards
    if (line.match(/^%</)) {
      continue;
    }

    // Skip special DTX commands
    if (
      line.match(/^% \\CheckSum/) ||
      line.match(/^% \\StopEventually/) ||
      line.match(/^% \\Finale/) ||
      line.match(/^% \\iffalse/) ||
      line.match(/^% \\fi/) ||
      line.match(/^% ----/)
    ) {
      continue;
    }

    // Handle macro environment
    if (line.match(/^% \\begin\{macro\}\{/)) {
      inMacroEnv = true;
      const macroName = line.match(/^% \\begin\{macro\}\{(.*?)\}/)?.[1];
      if (macroName) {
        // Escape backslashes for LaTeX
        const escapedName = macroName.replace(/\\/g, "\\textbackslash{}");
        output.push(`\n\\subsubsection{\\texttt{${escapedName}}}\n`);
      }
      continue;
    }

    if (line.match(/^% \\end\{macro\}/)) {
      inMacroEnv = false;
      continue;
    }

    // Handle macrocode blocks
    if (line.includes("\\begin{macrocode}")) {
      inMacrocode = true;
      output.push("\n\\begin{verbatim}\n");
      continue;
    }

    if (line.includes("\\end{macrocode}")) {
      inMacrocode = false;
      for (const codeLine of codeLines) {
        output.push(codeLine + "\n");
      }
      output.push("\\end{verbatim}\n\n");
      codeLines.length = 0;
      continue;
    }

    if (inMacrocode) {
      // Remove leading "%    " from code lines
      const code = line.replace(/^%    /, "");
      codeLines.push(code);
    } else if (line.match(/^% /) || line.match(/^%$/)) {
      // Documentation line - remove leading "% " or "%"
      const doc = line.replace(/^% ?/, "");
      output.push(doc + "\n");
    }
  }

  return output.join("");
}

/**
 * Extract metadata from DTX file (title, author, etc.)
 */
export function extractMetadata(dtxPath: string): {
  title?: string;
  package?: string;
  version?: string;
  date?: string;
} {
  // TODO: Parse \ProvidesPackage, \title, etc.
  return {};
}
