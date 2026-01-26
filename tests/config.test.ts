import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/core/config.js";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("loadConfig", () => {
  it("should load and parse a valid YAML config", async () => {
    const tempConfig = join(tmpdir(), `texweave-test-${Date.now()}.yaml`);

    await writeFile(
      tempConfig,
      `
output: docs/test
source: src/test
sourceRepo: https://github.com/test/repo
filter: test-filter.lua
titles:
  testfile: "Test Title"
`,
    );

    try {
      const config = await loadConfig(tempConfig);

      expect(config.output).toBe("docs/test");
      expect(config.source).toBe("src/test");
      expect(config.sourceRepo).toBe("https://github.com/test/repo");
      expect(config.filter).toBe("test-filter.lua");
      expect(config.titles?.testfile).toBe("Test Title");
    } finally {
      await unlink(tempConfig);
    }
  });

  it("should return defaults when config file does not exist", async () => {
    const config = await loadConfig("/nonexistent/config.yaml");

    expect(config.output).toBe("docs/implementation");
    expect(config.source).toBe("src");
    expect(config.sourceDir).toBe("src");
  });
});
