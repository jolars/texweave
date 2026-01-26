# TODO

## Phase 2: Polish & UX Improvements

- [ ] CLI: `texweave init` command for scaffolding new projects
- [ ] Template generation (Quarto/mdBook templates in `templates/` directory)
- [ ] Better error messages (especially for missing Pandoc dependency)
- [ ] Progress indicators for batch extraction of multiple DTX files
- [ ] Improve metadata extraction (`extractMetadata` function in extractor.ts)

## Phase 3: Additional Filters

- [ ] `describe-option.lua` - Semantic markup for package options (copy from
      Moloch)
- [ ] `describe-key.lua` - Semantic markup for configuration keys (copy from
      Moloch)
- [ ] `describe-command.lua` - Semantic markup for LaTeX commands
- [ ] `metadata.lua` - Extract version/author from `\ProvidesPackage`
      automatically

## Phase 4: Publishing & Promotion

- [ ] Publish to npm as `texweave` package
- [ ] Create example projects/gallery repository
- [ ] Write comprehensive blog post about the tool
- [ ] Announce on tex.stackexchange.com
- [ ] Add more examples to documentation

## Future Enhancements

- [ ] Quarto extension: `quarto add jolars/texweave`
- [ ] mdBook adapter for Rust documentation ecosystem
- [ ] Watch mode: `texweave extract --watch` for live development
- [ ] Integration with l3build for LaTeX package build systems
- [ ] Support for additional literate programming formats beyond DTX
- [ ] Parallel processing for large codebases with many DTX files
