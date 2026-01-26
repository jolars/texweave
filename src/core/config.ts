import { readFile } from "fs/promises";
import { parse } from "yaml";
import { z } from "zod";

// Config schema
const ConfigSchema = z.object({
  output: z.string().default("docs/implementation"),
  source: z.string().default("src"),
  sourceRepo: z.string().optional(),
  sourceDir: z.string().default("src"),
  filter: z.string().optional(),
  titles: z.record(z.string()).optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Load and validate texweave config from YAML file
 */
export async function loadConfig(
  path: string = "texweave.yaml",
): Promise<Config> {
  try {
    const content = await readFile(path, "utf-8");
    const raw = parse(content);
    return ConfigSchema.parse(raw);
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      // Return defaults if no config file
      return ConfigSchema.parse({});
    }
    throw error;
  }
}
