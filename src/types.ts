/**
 * Defines our experimental capabilities provided by the client.
 */
export interface ExperimentalClientCapabilities {
  experimental: {
    telemetryVersion?: number;
  };
}

export interface Build {
  name: string;
  downloadUrl: string;
}

export interface Release {
  version: string;
  assets: Build[];
}
