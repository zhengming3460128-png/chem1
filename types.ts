export interface Atom {
  id: number;
  element: string; // "H", "C", "O", etc.
  x2d: number; // For Lewis structure
  y2d: number;
  x3d: number; // For 3D geometry
  y3d: number;
  z3d: number;
  lonePairs: number;
  charge: number;
}

export interface Bond {
  source: number; // index of atom
  target: number; // index of atom
  order: number; // 1, 2, 3
}

export interface MoleculeData {
  formula: string;
  name: string;
  description: string;
  molecularGeometry: string; // e.g., "Bent", "Tetrahedral"
  hybridization: string; // e.g., "sp3"
  resonanceInfo: string; // Text description of resonance
  atoms: Atom[];
  bonds: Bond[];
}

export interface CPKColor {
  color: string;
  radius: number;
}

// Basic CPK coloring mapping
export const CPK_COLORS: Record<string, CPKColor> = {
  H: { color: '#FFFFFF', radius: 0.3 },
  C: { color: '#909090', radius: 0.7 },
  N: { color: '#3050F8', radius: 0.7 },
  O: { color: '#FF0D0D', radius: 0.6 },
  F: { color: '#90E050', radius: 0.5 },
  CL: { color: '#1FF01F', radius: 0.9 },
  BR: { color: '#A62929', radius: 1.1 },
  I: { color: '#940094', radius: 1.3 },
  HE: { color: '#D9FFFF', radius: 1.0 },
  NE: { color: '#B3E3F5', radius: 1.0 },
  AR: { color: '#80D1E3', radius: 1.0 },
  S: { color: '#FFFF30', radius: 1.0 },
  P: { color: '#FF8000', radius: 1.0 },
  DEFAULT: { color: '#FF69B4', radius: 0.8 },
};