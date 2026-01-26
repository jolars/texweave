# texweave - Project Plan

**A Pandoc-based documentation system for LaTeX packages**

## Vision

Turn LaTeX package documentation into modern, searchable websites with:
- DTX implementation docs extraction
- Semantic markup for options/keys/commands
- Executable LaTeX code blocks
- Works with any Pandoc-based renderer (Quarto, mdBook, etc.)

## Core Components

### 1. DTX Extractor (TypeScript CLI)
```bash
texweave extract src/*.dtx --output docs/implementation/
```

**Status:** ⏳ To implement  
**Priority:** P0 (MVP requirement)

**Features:**
- Extract documentation from DTX files
- Convert to clean Markdown via Pandoc
- Generate YAML frontmatter
- Support title mapping

### 2. Pandoc Filters (Lua)

#### a) describe-option.lua ✅
Document package options with semantic markup:
```markdown
::: {.describe-option option-name="titleformat" values="a, b" default="a"}
Description here
:::
```

#### b) describe-key.lua ✅
Document configuration keys:
```markdown
::: {.describe-key key-name="alert color" type="<color>" default="red"}
Description here
:::
```

#### c) exec-latex.lua ✅
Execute LaTeX code blocks:
```markdown
```{latex exec=true caption="Example"}
\tikz \draw (0,0) circle (1cm);
```
```

#### d) code-classes.lua ⏳
Add syntax highlighting classes to code blocks.

#### e) metadata.lua ⏳
Extract version from build.lua or package files.

### 3. Configuration System

**File:** `texweave.config.yaml`

```yaml
extract:
  input: src/*.dtx
  output: docs/implementation
  titles:
    beamercolorthememoloch: "Color Theme"

filters:
  - describe-option.lua
  - describe-key.lua
  - exec-latex.lua

metadata:
  version: auto
  repository: https://github.com/user/repo
```

**Status:** ⏳ To implement  
**Priority:** P1 (Nice to have)

## Project Structure

```
texweave/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── cli.ts              # CLI entry point (Commander.js)
│   ├── commands/
│   │   ├── extract.ts      # DTX extraction command
│   │   └── init.ts         # Project scaffolding
│   ├── core/
│   │   ├── extractor.ts    # DTX → LaTeX extraction
│   │   ├── converter.ts    # LaTeX → Markdown (Pandoc)
│   │   └── config.ts       # Config schema (Zod)
│   └── index.ts
├── filters/                # Pandoc Lua filters
│   ├── describe-option.lua
│   ├── describe-key.lua
│   ├── exec-latex.lua
│   ├── code-classes.lua
│   └── metadata.lua
├── templates/              # Scaffolding templates
│   ├── quarto/
│   │   ├── _quarto.yml
│   │   └── index.md
│   └── texweave.config.yaml
└── tests/
    └── fixtures/
```

## Development Phases

### Phase 1: MVP (Week 1-2)
- [x] Project scaffold
- [ ] Port DTX extractor from Lua to TypeScript
- [ ] Pandoc integration (converter.ts)
- [ ] CLI: `texweave extract`
- [ ] Bundle existing filters (describe-option, describe-key)
- [ ] Add exec-latex filter
- [ ] Test on Moloch package

**Deliverable:** Working extraction, can generate docs manually

### Phase 2: Polish (Week 3)
- [ ] Config file support (YAML)
- [ ] CLI: `texweave init`
- [ ] Template generation
- [ ] Better error messages
- [ ] Progress indicators

**Deliverable:** Great DX, easy setup

### Phase 3: Testing & Docs (Week 4)
- [ ] Write tests (Vitest)
- [ ] Write documentation
- [ ] Create example projects
- [ ] CI/CD setup

**Deliverable:** Production-ready

### Phase 4: Publish (Week 5)
- [ ] Publish to npm: `texweave`
- [ ] Announce on tex.stackexchange.com
- [ ] Blog post
- [ ] GitHub repo with examples

**Deliverable:** Public release v0.1.0

### Future Phases
- [ ] Quarto extension: `quarto add jolars/texweave`
- [ ] mdBook adapter
- [ ] describe-command.lua filter
- [ ] Watch mode: `texweave extract --watch`
- [ ] Integration with l3build

## Target Users

1. **LaTeX package authors** (CTAN maintainers)
2. **Academic template creators** (thesis classes, etc.)
3. **Beamer theme developers** (like you!)
4. **LaTeX documentation writers**

## Competitive Landscape

| Tool | Converts | To | Notes |
|------|----------|-----|-------|
| tex4ht | LaTeX docs | HTML | Dated output, complex |
| lwarp | LaTeX docs | HTML | Heavyweight, learning curve |
| texweave | DTX packages | Markdown | Modern, Pandoc-based |

**Differentiation:** We're not competing - we extract *package documentation* not *convert documents*.

## Success Metrics (1 year)

- 50+ GitHub stars
- 10+ packages using it
- Featured on CTAN news
- Referenced in LaTeX package tutorials

## Open Questions

1. Should `texweave build` orchestrate rendering? → **Defer to Phase 3**
2. Support other literate programming formats? → **Start DTX only**
3. Create visual theme/CSS? → **No, renderer's job**
4. Integration with l3build? → **Future**

## Getting Started (Today!)

```bash
# Create GitHub repo
cd ~/projects
mkdir texweave
cd texweave
git init
gh repo create texweave --public --source=. --remote=origin

# Copy scaffold
cp -r /tmp/texweave-poc/* .

# Install dependencies
npm install

# Start coding!
code src/core/extractor.ts
```

## Next Steps

1. Implement `extractor.ts` (port from Lua)
2. Implement `converter.ts` (call Pandoc)
3. Wire up CLI
4. Test on Moloch DTX files
5. Iterate until output matches current system

**First goal:** Replace `texlua scripts/extract-dtx-docs.lua` with `texweave extract`
