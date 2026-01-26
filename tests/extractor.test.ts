import { describe, it, expect } from "vitest";
import { extractDTX } from "../src/core/extractor.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("extractDTX", () => {
  it("should extract documentation from a simple DTX file", async () => {
    const fixturePath = join(__dirname, "fixtures", "simple.dtx");
    const result = await extractDTX(fixturePath);

    // Should contain the subsection
    expect(result).toContain("\\subsection{Test Package}");

    // Should contain documentation text
    expect(result).toContain("This is a simple test package for texweave");

    // Should contain the macro as subsubsection
    expect(result).toContain(
      "\\subsubsection{\\texttt{\\textbackslash{}testmacro}}",
    );

    // Should contain code blocks in verbatim
    expect(result).toContain("\\begin{verbatim}");
    expect(result).toContain("\\newcommand{\\testmacro}{Hello World}");
    expect(result).toContain("\\end{verbatim}");

    // Should NOT contain docstrip guards
    expect(result).not.toContain("%<*package>");
    expect(result).not.toContain("%</package>");
  });

  it("should handle empty macrocode blocks", async () => {
    const fixturePath = join(__dirname, "fixtures", "simple.dtx");
    const result = await extractDTX(fixturePath);

    // Should have proper verbatim structure
    const verbatimCount = (result.match(/\\begin{verbatim}/g) || []).length;
    const endVerbatimCount = (result.match(/\\end{verbatim}/g) || []).length;
    expect(verbatimCount).toBe(endVerbatimCount);
  });
});
