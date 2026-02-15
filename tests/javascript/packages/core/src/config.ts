export interface Config {
  port: number;
  host: string;
  debug: boolean;
  database: {
    url: string;
    pool: number;
  };
}

const defaults: Config = {
  port: 3000,
  host: "localhost",
  debug: false,
  database: {
    url: "postgres://localhost:5432/app",
    pool: 10,
  },
};

// TODO: Add support for loading config from YAML files
// TODO: Validate config schema with zod or similar
export function loadConfig(overrides: Partial<Config> = {}): Config {
  const env = process.env.NODE_ENV || "development";

  // HACK: Temporary workaround for CI environment detection
  const isCI =
    process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

  const config: Config = {
    ...defaults,
    ...overrides,
    debug: env === "development" || isCI,
  };

  // FIXME: Database URL should be validated before use
  if (!config.database.url) {
    throw new Error("Database URL is required");
  }

  return config;
}

export function mergeConfigs(
  base: Config,
  override: Partial<Config>,
): Config {
  return {
    ...base,
    ...override,
    database: {
      ...base.database,
      ...(override.database || {}),
    },
  };
}

// REVIEW: Should we cache the config instance?
let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}
