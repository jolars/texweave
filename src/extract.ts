import { extractDTX } from "./core/extractor.js";
import { convertToMarkdown } from "./core/converter.js";
import { writeFile, mkdir } from "fs/promises";
import { glob } from "glob";
import { basename } from "path";

export interface ExtractOptions {
  output: string;
  filter?: string;
  titles?: Record<string, string>;
  sourceRepo?: string;
  sourceDir?: string;
}

export async function extract(files: string[], options: ExtractOptions) {
  // Expand glob patterns
  let dtxFiles: string[] = [];
  if (files.length > 0) {
    for (const pattern of files) {
      const matches = await glob(pattern);
      dtxFiles.push(...matches);
    }
  } else {
    dtxFiles = await glob("src/*.dtx");
  }

  if (dtxFiles.length === 0) {
    console.error("No DTX files found");
    process.exit(1);
  }

  await mkdir(options.output, { recursive: true });

  for (const dtxFile of dtxFiles) {
    console.log(`Extracting ${dtxFile}...`);

    // Extract DTX to LaTeX
    const latex = await extractDTX(dtxFile);

    // Convert LaTeX to Markdown
    const markdown = await convertToMarkdown(latex, { filter: options.filter });

    // Add frontmatter
    const base = basename(dtxFile, ".dtx");
    const title = options.titles?.[base] || base;
    let output = `---\ntitle: "${title}"\n---\n\n`;

    // Add source callout if repo specified
    if (options.sourceRepo) {
      const sourceDir = options.sourceDir || "src";
      output += `::: {.callout-note}\n\n`;
      output += `**Source file:** [\`${sourceDir}/${base}.dtx\`](${options.sourceRepo}/blob/main/${sourceDir}/${base}.dtx)\n\n`;
      output += `:::\n\n`;
    }

    output += markdown;

    // Write output
    const outPath = `${options.output}/${base}.md`;
    await writeFile(outPath, output);
    console.log(`  → ${outPath}`);
  }
}
