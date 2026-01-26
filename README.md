# texweave

**Weave modern documentation from LaTeX packages**

A CLI tool for extracting documentation from DTX files and converting them to Markdown with Pandoc.

## Installation

```bash
npm install -g texweave
```

## Usage

### With config file (recommended)

Create `texweave.yaml`:
```yaml
output: docs/implementation
source: src
sourceRepo: https://github.com/yourusername/your-package
filter: filters/code-classes.lua
titles:
  yourpackage: "Your Package Title"
```

Then simply run:
```bash
texweave extract
```

### With CLI options

```bash
# Extract documentation from DTX files
texweave extract src/*.dtx -o docs/implementation

# With custom Pandoc filter
texweave extract src/*.dtx -f ./my-filter.lua

# With source repo links
texweave extract src/*.dtx -r https://github.com/user/repo

# From current directory (defaults to src/*.dtx)
texweave extract
```

## Example

```bash
# In your LaTeX package directory
cd my-beamer-theme
texweave extract src/*.dtx

# Output: docs/implementation/*.md files ready for Quarto/MkDocs/etc
```

## Features

- **DTX extraction**: Parses `.dtx` files and extracts documentation sections
- **Pandoc integration**: Converts LaTeX to Markdown with optional Lua filters
- **Code highlighting**: Automatically adds `latex` class to code blocks
- **Frontmatter**: Adds YAML frontmatter to output files

## How It Works

1. Reads DTX file line by line
2. Extracts documentation (lines starting with `%`)
3. Converts `\begin{macro}` to subsubsections
4. Wraps `\begin{macrocode}` blocks in verbatim
5. Pipes through Pandoc to generate clean Markdown

## Development

```bash
git clone https://github.com/jolars/texweave.git
cd texweave
pnpm install
pnpm run build
```

## License

MIT
