#!/usr/bin/env node

import { Command } from "commander";
import { extract } from "./extract.js";
import { loadConfig } from "./core/config.js";

const program = new Command();

program
  .name("texweave")
  .description("Weave modern documentation from LaTeX packages")
  .version("0.1.0");

program
  .command("extract")
  .description("Extract documentation from DTX files")
  .argument("[files...]", "DTX files to process (defaults to src/*.dtx)")
  .option("-c, --config <file>", "Config file path", "texweave.yaml")
  .option("-o, --output <dir>", "Output directory")
  .option("-f, --filter <file>", "Additional Pandoc Lua filter to apply")
  .option("-r, --source-repo <url>", "GitHub repo URL for source links")
  .option("-d, --source-dir <dir>", "Source directory name")
  .option("-t, --titles <json>", "JSON object mapping filenames to titles")
  .action(async (files, options) => {
    try {
      // Load config file
      const config = await loadConfig(options.config);

      // CLI options override config file
      const mergedOptions = {
        ...config,
        ...options,
      };

      // Parse titles if provided as JSON string
      if (typeof mergedOptions.titles === "string") {
        try {
          mergedOptions.titles = JSON.parse(mergedOptions.titles);
        } catch (e) {
          console.error("Error: Invalid JSON for --titles");
          process.exit(1);
        }
      }

      // Use files from config.source if no files specified
      if (files.length === 0 && config.source) {
        files = [`${config.source}/*.dtx`];
      }

      await extract(files, mergedOptions);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program.parse();
