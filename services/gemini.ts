import { GoogleGenAI, Type } from "@google/genai";
import { MoleculeData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMoleculeData = async (formula: string): Promise<MoleculeData> => {
  const prompt = `
    Analyze the molecule with the chemical formula "${formula}".
    Provide a detailed JSON response representing its Lewis Structure (2D) and VSEPR Geometry (3D).
    
    1. Identify all atoms and their connectivity.
    2. Calculate reasonable 2D coordinates (x, y) for a clean Lewis Structure diagram. Ensure atoms are spread out to minimize overlap and bonds are distinct.
    3. Calculate reasonable 3D coordinates (x, y, z) based on VSEPR theory (e.g., 109.5 degrees for tetrahedral). Scale coordinates so bond lengths are roughly 1.5 units.
    4. Identify lone pairs for each atom.
    5. Identify bond orders (1=single, 2=double, 3=triple).
    6. Provide the geometry name, hybridization of the central atom, and a note on resonance.
    
    Ensure the "id" in bonds corresponds to the index of the atom in the "atoms" array (0-based).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          formula: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          molecularGeometry: { type: Type.STRING },
          hybridization: { type: Type.STRING },
          resonanceInfo: { type: Type.STRING },
          atoms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                element: { type: Type.STRING },
                x2d: { type: Type.NUMBER },
                y2d: { type: Type.NUMBER },
                x3d: { type: Type.NUMBER },
                y3d: { type: Type.NUMBER },
                z3d: { type: Type.NUMBER },
                lonePairs: { type: Type.INTEGER },
                charge: { type: Type.INTEGER },
              },
              required: ['id', 'element', 'x2d', 'y2d', 'x3d', 'y3d', 'z3d', 'lonePairs', 'charge']
            }
          },
          bonds: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.INTEGER, description: "Index of source atom" },
                target: { type: Type.INTEGER, description: "Index of target atom" },
                order: { type: Type.INTEGER, description: "1, 2, or 3" }
              },
              required: ['source', 'target', 'order']
            }
          }
        },
        required: ['formula', 'name', 'atoms', 'bonds', 'molecularGeometry']
      }
    }
  });

  if (!response.text) {
    throw new Error("No data returned from Gemini");
  }

  return JSON.parse(response.text) as MoleculeData;
};