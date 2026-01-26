# Getting Started with texweave Development

## Quick Start (5 minutes)

```bash
# 1. Create repo
cd ~/projects
mkdir texweave && cd texweave
git init
gh repo create texweave --public --source=. --remote=origin

# 2. Copy scaffold from POC
cp -r /tmp/texweave-poc/* .

# 3. Install dependencies
npm install

# 4. Start developing
npm run dev  # TypeScript watch mode
```

## Project Overview

**texweave** extracts documentation from LaTeX packages and generates modern websites.

**Core value:**
1. DTX extraction (implementation docs)
2. Semantic markup for package options (`describe-option`, etc.)
3. Executable LaTeX blocks (like Quarto for R/Python)

## File Structure You'll Work With

```
texweave/
├── src/
│   ├── core/
│   │   ├── extractor.ts    ← START HERE (port your Lua script)
│   │   └── converter.ts    ← Call Pandoc
│   ├── commands/
│   │   └── extract.ts      ← Wire up the CLI
│   └── cli.ts              ← Entry point
└── filters/
    ├── exec-latex.lua      ← Already done! ✅
    ├── describe-option.lua ← Copy from Moloch
    └── describe-key.lua    ← Copy from Moloch
```

## First Task: Port the Extractor

Open `src/core/extractor.ts` - the logic is already outlined based on your Lua script.

**What to do:**
1. Compare with `/home/jola/projects/moloch/scripts/extract-dtx-docs.lua`
2. Port the line-by-line logic
3. Test on one DTX file: `beamercolorthememoloch.dtx`

**Test command:**
```typescript
// Quick test in src/test.ts
import { extractDTX } from './core/extractor.js';
const latex = await extractDTX('../moloch/src/beamercolorthememoloch.dtx');
console.log(latex);
```

## Second Task: Pandoc Integration

Open `src/core/converter.ts`:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs/promises';

const execAsync = promisify(exec);

export async function convertToMarkdown(
  latexContent: string,
  filterPath?: string
): Promise<string> {
  // 1. Write latex to temp file
  const tempTex = '/tmp/temp.tex';
  await writeFile(tempTex, latexContent);
  
  // 2. Build pandoc command
  const filterArg = filterPath ? `--lua-filter=${filterPath}` : '';
  const cmd = `pandoc ${tempTex} -f latex -t markdown ${filterArg}`;
  
  // 3. Execute
  const { stdout, stderr } = await execAsync(cmd);
  if (stderr) console.error(stderr);
  
  return stdout;
}
```

## Third Task: Wire Up CLI

Open `src/commands/extract.ts`:

```typescript
import { extractDTX } from '../core/extractor.js';
import { convertToMarkdown } from '../core/converter.js';
import { writeFile, mkdir } from 'fs/promises';
import { glob } from 'glob';

export async function extract(files: string[], options: any) {
  const dtxFiles = files.length > 0 ? files : await glob('src/*.dtx');
  
  await mkdir(options.output, { recursive: true });
  
  for (const dtxFile of dtxFiles) {
    console.log(`Extracting ${dtxFile}...`);
    
    // Extract DTX to LaTeX
    const latex = await extractDTX(dtxFile);
    
    // Convert LaTeX to Markdown
    const markdown = await convertToMarkdown(latex, options.filter);
    
    // Add frontmatter
    const basename = dtxFile.split('/').pop()!.replace('.dtx', '');
    const title = options.titles?.[basename] || basename;
    const output = `---\ntitle: "${title}"\n---\n\n${markdown}`;
    
    // Write output
    const outPath = `${options.output}/${basename}.md`;
    await writeFile(outPath, output);
    console.log(`  → ${outPath}`);
  }
}
```

## Testing Your Work

```bash
# Build TypeScript
npm run build

# Test extraction on Moloch
cd ~/projects/moloch
node ~/projects/texweave/dist/cli.js extract src/beamercolorthememoloch.dtx

# Compare output
diff docs/implementation/beamercolorthememoloch.md \
     /tmp/output/beamercolorthememoloch.md
```

## When You're Ready

```bash
# Commit initial work
git add .
git commit -m "feat: initial DTX extractor implementation"
git push

# Create npm package
npm publish --access public
```

## Questions During Development?

**Q: Where's the config file loading?**  
A: Skip for MVP. Add in Phase 2.

**Q: Should I add the `build` command now?**  
A: No. Focus on `extract` only.

**Q: Tests?**  
A: Add after MVP works. Use Vitest.

**Q: What about the filters?**  
A: Copy from Moloch, they're already done:
```bash
cp ~/projects/moloch/docs/filters/*.lua filters/
cp ~/projects/moloch/convert-filter.lua filters/code-classes.lua
```

## Success Criteria (MVP)

✅ `texweave extract src/*.dtx` works  
✅ Output matches current Lua script  
✅ Filters are bundled  
✅ README.md with usage examples  
✅ Can use in Moloch project

**Then you're ready to publish v0.1.0!**

## Timeline

- **Today**: Create repo, copy scaffold
- **This weekend**: Implement extractor
- **Next week**: Polish CLI, test thoroughly
- **Week after**: Publish to npm

## Resources

- Your Lua script: `/home/jola/projects/moloch/scripts/extract-dtx-docs.lua`
- Pandoc docs: https://pandoc.org/lua-filters.html
- Commander.js: https://github.com/tj/commander.js
- Zod: https://zod.dev (for config validation)

Good luck! 🚀
