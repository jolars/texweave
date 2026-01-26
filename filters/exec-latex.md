# exec-latex.lua - Executable LaTeX Code Blocks

A Pandoc Lua filter that executes LaTeX code blocks and includes the rendered output as images in your documentation.

## Features

- ✅ Execute LaTeX code snippets inline
- ✅ Automatic caching (SHA1-based)
- ✅ Auto-wraps snippets in `standalone` document
- ✅ Multiple LaTeX engines (pdflatex, xelatex, lualatex)
- ✅ Configurable DPI, cropping, dimensions
- ✅ Figure captions support
- ✅ Error handling with styled error blocks

## Installation

Include the filter when running Pandoc:

```bash
pandoc input.md --lua-filter=exec-latex.lua -o output.html
```

Or in Quarto `_quarto.yml`:

```yaml
filters:
  - filters/exec-latex.lua
```

## Dependencies

- `pdflatex` (or `xelatex`, `lualatex`)
- ImageMagick (`convert` command)

## Basic Usage

Execute a simple LaTeX snippet:

````markdown
```{latex exec=true}
\tikz \draw (0,0) circle (1cm);
```
````

The filter will:
1. Wrap it in a `standalone` document with TikZ loaded
2. Compile with `pdflatex`
3. Convert to PNG at 300 DPI
4. Include as image

## Full Document Example

Pass a complete LaTeX document:

````markdown
```{latex exec=true}
\documentclass{standalone}
\usepackage{amsmath}
\begin{document}
$E = mc^2$
\end{document}
```
````

## Options

### Image Dimensions

````markdown
```{latex exec=true width="50%" height="200px"}
\tikz \draw[fill=blue] (0,0) circle (1cm);
```
````

### Figure Caption

````markdown
```{latex exec=true caption="A blue circle"}
\tikz \draw[fill=blue] (0,0) circle (1cm);
```
````

### Custom DPI

````markdown
```{latex exec=true dpi=600}
\tikz \draw (0,0) -- (5,5);
```
````

### LaTeX Engine

````markdown
```{latex exec=true engine="xelatex"}
\documentclass{standalone}
\usepackage{fontspec}
\begin{document}
Hello with XeLaTeX!
\end{document}
```
````

### Disable Auto-Crop

````markdown
```{latex exec=true crop=false}
\tikz \draw (0,0) circle (1cm);
```
````

## Global Configuration

Configure in document metadata:

```yaml
---
title: My Document
exec-latex:
  cache-dir: .latex-cache
  dpi: 450
  engine: lualatex
  debug: true
---
```

## Caching

Compiled images are cached in `_latex_cache/` (configurable).

- Same code → Reuses cached image
- Changed code → Recompiles
- Cache key: SHA1 of LaTeX code + engine

Add to `.gitignore`:

```
_latex_cache/
```

## Error Handling

If compilation fails:
- Error is printed to stderr
- Code block is returned with `.latex-error` class
- Wrapped in a callout-error div (if renderer supports it)

## Real-World Examples

### Beamer Theme Example

````markdown
## Color Options

Custom alert color:

```{latex exec=true caption="Orange alert text"}
\documentclass{beamer}
\usetheme{moloch}
\molochcolors{alerted text=orange}

\begin{document}
\begin{frame}
  \alert{This text is orange!}
\end{frame}
\end{document}
```
````

### TikZ Diagram

````markdown
## Architecture

```{latex exec=true width="80%"}
\begin{tikzpicture}
  \node[rectangle,draw] (a) {Input};
  \node[rectangle,draw,right=of a] (b) {Process};
  \node[rectangle,draw,right=of b] (c) {Output};
  \draw[->] (a) -- (b);
  \draw[->] (b) -- (c);
\end{tikzpicture}
```
````

### Mathematical Formula

````markdown
```{latex exec=true}
\[
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
\]
```
````

## Troubleshooting

### "pdflatex not found"

Install TeX Live:
```bash
# Ubuntu/Debian
sudo apt-get install texlive-full

# macOS
brew install --cask mactex

# Windows
# Download from https://tug.org/texlive/
```

### "convert not found"

Install ImageMagick:
```bash
# Ubuntu/Debian
sudo apt-get install imagemagick

# macOS
brew install imagemagick

# Windows
# Download from https://imagemagick.org/
```

### Compilation errors

Enable debug mode to see full LaTeX output:

```yaml
---
exec-latex:
  debug: true
---
```

## Performance Tips

1. **Caching**: Unchanged code blocks aren't recompiled
2. **DPI**: Lower DPI (150-200) for faster compilation
3. **Crop**: Disable if not needed (`crop=false`)
4. **Engine**: `pdflatex` is usually fastest

## Comparison with Quarto

| Feature | Quarto | exec-latex |
|---------|--------|------------|
| R/Python | ✅ | ❌ |
| LaTeX | ❌ | ✅ |
| Works with plain Pandoc | ❌ | ✅ |
| Caching | ✅ | ✅ |
| Multiple engines | ❌ | ✅ |

## License

MIT License - Same as texweave
