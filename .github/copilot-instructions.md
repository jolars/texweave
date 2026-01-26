# Copilot Instructions for texweave

## Project Overview

**texweave** is a CLI tool that extracts documentation from LaTeX DTX files and
converts them to Markdown using Pandoc. It's a small TypeScript/Node.js project
(~500 lines) designed for LaTeX package authors who want to generate modern
documentation websites.

- **Language**: TypeScript (ES2022 modules)
- **Runtime**: Node.js >= 18.0.0
- **Package Manager**: pnpm (required - npm/yarn will not work correctly)
- **External Dependencies**: Pandoc (must be available in PATH)
- **Size**: Small codebase with 5 main source files

## Critical Build Requirements

### Installation and Build Order

**ALWAYS follow this exact sequence:**

```bash
# 1. Install dependencies (REQUIRED before any other command)
pnpm install --frozen-lockfile

# 2. Build TypeScript to JavaScript
pnpm run build

# 3. Run tests (optional validation)
pnpm test
```

**Key Points:**

- Always use `pnpm`, never `npm` or `yarn` - the project uses pnpm workspace
  features
- `pnpm install --frozen-lockfile` ensures reproducible builds and must be run
  before building
- The `build` script compiles TypeScript from `src/` to `dist/` using `tsc`
- Build takes ~2-5 seconds and produces no output on success
- Tests run with Vitest and take ~100-150ms

### Known Build Issues

**ISSUE 1: Missing lint script**

- The GitHub Actions workflow `.github/workflows/build-and-test.yml` references
  `pnpm run lint` on line 68
- This script does NOT exist in package.json and will fail with:
  `ERR_PNPM_NO_SCRIPT Missing script: lint`
- **Workaround**: Remove the lint job from workflows OR add a lint script using
  eslint/tslint if implementing linting

**ISSUE 2: Format script behavior**

- `pnpm run format` runs Prettier with `--write` flag (modifies files)
- The workflow uses `--check` flag which requires modifying the command
- **Workaround**: To check formatting without modifying:
  `pnpm run format -- --check`

**ISSUE 3: Pandoc runtime dependency**

- The tool requires `pandoc` to be installed and available in PATH
- Tests and CLI will fail silently or with cryptic errors if Pandoc is missing
- Check with: `pandoc --version` (should be >= 3.0)
- Required for: `src/core/converter.ts` which shells out to pandoc command

## Project Structure

### Source Layout (src/)

```
src/
├── cli.ts              - CLI entry point (Commander.js), handles argument parsing
├── extract.ts          - Main extraction logic, orchestrates extractor + converter
└── core/
    ├── extractor.ts    - DTX parser (LaTeX -> intermediate LaTeX)
    ├── converter.ts    - Pandoc wrapper (LaTeX -> Markdown)
    └── config.ts       - YAML config loader with Zod validation
```

### Key Files in Repository Root

- `package.json` - NPM metadata, scripts, and dependencies (ES module type)
- `tsconfig.json` - TypeScript compiler config (ES2022 target, strict mode)
- `vitest.config.ts` - Test configuration (Vitest with v8 coverage)
- `pnpm-workspace.yaml` - pnpm workspace config (currently minimal)
- `devenv.nix` - Nix development environment (provides pnpm, node, texlive,
  pandoc)
- `setup-tests.sh` - Script to generate test fixtures and test files

### Configuration Files

- **TypeScript**: `tsconfig.json` (outDir: dist, rootDir: src, strict: true)
- **Tests**: `vitest.config.ts` (node environment, v8 coverage provider)
- **Package Manager**: `pnpm-workspace.yaml` (workspace root)
- **Formatting**: Uses Prettier (implicit config via format script)

### Filters (filters/)

Pandoc Lua filters that get bundled with the package:

- `code-classes.lua` - Adds `latex` class to code blocks for syntax highlighting
- `exec-latex.lua` - Executes LaTeX snippets and embeds rendered images (like
  Quarto for LaTeX)
- `exec-latex.md` - Documentation for the exec-latex filter

### Tests (tests/)

- `tests/extractor.test.ts` - Tests DTX extraction logic
- `tests/config.test.ts` - Tests YAML config loading
- `tests/fixtures/simple.dtx` - Sample DTX file for testing

## Testing and Validation

### Running Tests

```bash
# Run all tests (fast, ~120ms)
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode during development
pnpm run dev  # TypeScript watch in another terminal
pnpm test     # Runs once, re-run manually after changes
```

**Test Expectations:**

- All 4 tests should pass (2 in extractor.test.ts, 2 in config.test.ts)
- Tests run in Node environment, not browser
- No tests currently validate Pandoc integration end-to-end

### Manual Testing

```bash
# After building, test the CLI manually:
node dist/cli.js --help
node dist/cli.js extract --help

# Test extraction on the fixture:
node dist/cli.js extract tests/fixtures/simple.dtx -o /tmp/test-output

# Verify output:
cat /tmp/test-output/simple.md
# Should contain: title frontmatter, markdown sections, code blocks
```

### Formatting

```bash
# Check formatting (doesn't modify files):
pnpm run format -- --check

# Fix formatting (modifies files):
pnpm run format
```

**Note:** Formatting currently shows warnings but exits with code 0. Consider
this when CI expects strict formatting checks.

## GitHub Actions CI Pipeline

The project has 3 workflows in `.github/workflows/`:

### 1. build-and-test.yml (Runs on PRs and pushes to main)

**Matrix strategy:**

- OS: ubuntu-latest, macos-latest, windows-latest
- Node: 18, 20

**Steps:**

1. Checkout code
2. Install pnpm (version 8)
3. Setup Node.js with pnpm cache
4. `pnpm install --frozen-lockfile`
5. `pnpm run build`
6. `pnpm test`
7. `pnpm run format --check` (only on ubuntu-latest + node 20)
8. **Separate lint job** that runs `pnpm run lint` - **WILL FAIL** (script
   doesn't exist)

**To pass CI**, ensure:

- TypeScript compiles without errors
- All tests pass
- Code is formatted with Prettier
- Either add a lint script or remove the lint job

### 2. coverage.yml (Runs on push to main)

Generates code coverage and uploads to Codecov. Requires `CODECOV_TOKEN` secret.

### 3. release.yml (Manual trigger only)

Runs semantic-release to publish to npm. Requires `RELEASE_TOKEN` secret.

## CLI Usage

The tool provides one main command: `extract`

```bash
# Extract from config file (reads texweave.yaml):
texweave extract

# Extract specific files:
texweave extract src/*.dtx -o docs/implementation

# With custom filter:
texweave extract src/*.dtx -f filters/code-classes.lua

# With source repo links:
texweave extract src/*.dtx -r https://github.com/user/repo
```

**Config File Format** (texweave.yaml):

```yaml
output: docs/implementation
source: src
sourceRepo: https://github.com/jolars/texweave
sourceDir: src
filter: filters/code-classes.lua
titles:
  myfile: "Custom Title for myfile.dtx"
```

## Architecture Notes

### DTX Extraction Process

1. **Input**: LaTeX DTX file (literate programming format for LaTeX packages)
2. **Extractor** (`src/core/extractor.ts`):
   - Strips docstrip guards (`%<*package>`, etc.)
   - Extracts documentation lines (those starting with `%`)
   - Converts `\begin{macro}` to `\subsubsection` headings
   - Wraps `\begin{macrocode}` blocks in `\begin{verbatim}`
   - Output: Intermediate LaTeX format
3. **Converter** (`src/core/converter.ts`):
   - Writes LaTeX to temp file in `/tmp/`
   - Calls `pandoc` command with optional Lua filter
   - Returns Markdown output
4. **Output**: Markdown file with YAML frontmatter and optional source callout

### Dependencies Between Files

- `cli.ts` → `extract.ts` + `core/config.ts`
- `extract.ts` → `core/extractor.ts` + `core/converter.ts`
- All files use ES modules (`import`/`export`)
- No circular dependencies

### Known TODOs

- `src/core/extractor.ts:108` - TODO: Parse `\ProvidesPackage`, `\title`
  metadata from DTX
- `filters/exec-latex.lua:236` - TODO: Parse packages from attribute in exec
  blocks

## Development Workflow

### Making Changes

1. **Always build after code changes:** `pnpm run build`
2. **Run tests to verify:** `pnpm test`
3. **Test CLI manually:**
   `node dist/cli.js extract tests/fixtures/simple.dtx -o /tmp/out`
4. **Check formatting:** `pnpm run format -- --check`

### Watch Mode

```bash
# Terminal 1: TypeScript watch mode
pnpm run dev

# Terminal 2: Manually test after changes
node dist/cli.js extract tests/fixtures/simple.dtx -o /tmp/out
```

**Note:** No test watch mode is configured. Re-run `pnpm test` manually.

## Common Pitfalls

1. **Forgetting to rebuild** - TypeScript must be compiled to JavaScript. Always
   run `pnpm run build` after source changes.
2. **Using npm/yarn** - The project requires pnpm. Using other package managers
   may cause issues.
3. **Missing Pandoc** - The tool requires Pandoc in PATH. Not a Node dependency.
4. **CI lint failure** - The workflow references a nonexistent lint script.
5. **Async without await** - The extractor/converter use async/await for file
   I/O. Don't forget `await`.

## External Documentation

- **DTX format**: LaTeX literate programming format (see: `texdoc dtx`)
- **Pandoc**: Universal document converter (https://pandoc.org)
- **Commander.js**: CLI framework (https://github.com/tj/commander.js)
- **Zod**: TypeScript-first schema validation (https://zod.dev)
- **Vitest**: Unit testing framework (https://vitest.dev)

## Trust These Instructions

This file was generated by thoroughly examining the codebase, testing build
processes, running CI workflows, and documenting actual behavior. Only perform
additional searches if:

- These instructions are incomplete for your specific task
- The codebase has changed significantly since this file was created
- You encounter behavior that contradicts what's documented here

When in doubt, verify commands work by running them in a clean state (after
`rm -rf dist/ node_modules/`).
