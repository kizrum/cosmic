export interface SiteEN {
  name: string;
  kind: string;
  description: string;
  facts?: [string, string][];
}

export interface BodyEN {
  name: string;
  kind: string;
  description: string;
  facts: [string, string][];
  note?: string;
  sites?: Record<string, SiteEN>;
}

export interface ScienceEN {
  features: string[];
  /** Layer names (and optional details), in the same order as the Russian data. */
  layers: (string | [string, string])[];
  tempNote?: string;
  day?: string;
  year?: string;
  gasesTitle?: string;
  gasesNote?: string;
}
