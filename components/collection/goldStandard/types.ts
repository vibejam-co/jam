
export interface Signal {
  label: string;
  value: string;
  verified: boolean;
}

export interface CreatorData {
  name: string;
  role: string;
  location: string;
  narrative: string;
  signals: Signal[];
  heroImage: string;
}
