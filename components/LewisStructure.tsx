import React, { useMemo, useState } from 'react';
import { MoleculeData, CPK_COLORS } from '../types';

interface LewisStructureProps {
  data: MoleculeData;
  showLonePairs: boolean;
  showCharges: boolean;
}

const LewisStructure: React.FC<LewisStructureProps> = ({ data, showLonePairs, showCharges }) => {
  const [hoveredAtom, setHoveredAtom] = useState<number | null>(null);

  // Normalize 2D coordinates and scale them to ensure good visibility without clipping
  const { normalizedAtoms, bonds, viewBox } = useMemo(() => {
    if (data.atoms.length === 0) {
      return { normalizedAtoms: [], bonds: [], viewBox: "0 0 100 100" };
    }

    // 1. Calculate Average Bond Length from raw data to determine natural scale
    let totalLength = 0;
    let bondCount = 0;
    data.bonds.forEach(bond => {
        const source = data.atoms[bond.source];
        const target = data.atoms[bond.target];
        if (source && target) {
            const dx = source.x2d - target.x2d;
            const dy = source.y2d - target.y2d;
            totalLength += Math.sqrt(dx * dx + dy * dy);
            bondCount++;
        }
    });

    // If only one atom or weird data, default to scale 1
    const avgLen = bondCount > 0 ? totalLength / bondCount : 1;
    
    // Target visual bond length (in SVG units) to ensure atoms (radius ~14) don't overlap
    const TARGET_BOND_LENGTH = 60; 
    
    // Scale factor to normalize the drawing
    const scale = avgLen > 0.001 ? TARGET_BOND_LENGTH / avgLen : 60;

    // 2. Scale all atoms
    const scaledAtoms = data.atoms.map(atom => ({
        ...atom,
        x: atom.x2d * scale,
        y: atom.y2d * scale
    }));

    // 3. Calculate Bounding Box of scaled atoms
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    scaledAtoms.forEach(a => {
        minX = Math.min(minX, a.x);
        maxX = Math.max(maxX, a.x);
        minY = Math.min(minY, a.y);
        maxY = Math.max(maxY, a.y);
    });

    // 4. Add Padding to ensure nothing is cut off
    // Enough for atom radius (14) + lone pairs (~10) + labels + charge
    const PADDING = 40; 
    const boxX = minX - PADDING;
    const boxY = minY - PADDING;
    const boxW = (maxX - minX) + (PADDING * 2);
    const boxH = (maxY - minY) + (PADDING * 2);

    return {
        normalizedAtoms: scaledAtoms,
        bonds: data.bonds,
        viewBox: `${boxX} ${boxY} ${boxW} ${boxH}`
    };
  }, [data]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-xl shadow-inner overflow-hidden relative group">
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        className="pointer-events-auto select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="atom-shadow" x="-50%" y="-50%" width="200%" height="200%">
             <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Bonds */}
        {bonds.map((bond, idx) => {
          const start = normalizedAtoms[bond.source];
          const end = normalizedAtoms[bond.target];
          
          if(!start || !end) return null;

          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len < 1) return null; // Avoid zero length bonds

          const nx = -dy / len; // Normal vector
          const ny = dx / len;

          const offset = 3; // Spacing for double/triple bonds
          const bondStyle = { stroke: "#334155", strokeWidth: 2.5, strokeLinecap: "round" as const };

          if (bond.order === 1) {
            return (
              <line
                key={`bond-${idx}`}
                x1={start.x} y1={start.y}
                x2={end.x} y2={end.y}
                {...bondStyle}
              />
            );
          } else if (bond.order === 2) {
             return (
               <g key={`bond-${idx}`}>
                  <line
                    x1={start.x + nx * offset} y1={start.y + ny * offset}
                    x2={end.x + nx * offset} y2={end.y + ny * offset}
                    {...bondStyle}
                  />
                  <line
                    x1={start.x - nx * offset} y1={start.y - ny * offset}
                    x2={end.x - nx * offset} y2={end.y - ny * offset}
                    {...bondStyle}
                  />
               </g>
             );
          } else if (bond.order === 3) {
            return (
                <g key={`bond-${idx}`}>
                   <line
                     x1={start.x} y1={start.y}
                     x2={end.x} y2={end.y}
                     {...bondStyle}
                   />
                   <line
                     x1={start.x + nx * offset * 2.5} y1={start.y + ny * offset * 2.5}
                     x2={end.x + nx * offset * 2.5} y2={end.y + ny * offset * 2.5}
                     {...bondStyle}
                   />
                   <line
                     x1={start.x - nx * offset * 2.5} y1={start.y - ny * offset * 2.5}
                     x2={end.x - nx * offset * 2.5} y2={end.y - ny * offset * 2.5}
                     {...bondStyle}
                   />
                </g>
              );
          }
          return null;
        })}

        {/* Atoms */}
        {normalizedAtoms.map((atom) => {
          const atomColor = CPK_COLORS[atom.element.toUpperCase()] || CPK_COLORS.DEFAULT;
          const isHydrogen = atom.element.toUpperCase() === 'H';
          const radius = isHydrogen ? 10 : 14;
          const isHovered = hoveredAtom === atom.id;
          
          return (
            <g 
                key={`atom-${atom.id}`} 
                transform={`translate(${atom.x}, ${atom.y})`}
                onMouseEnter={() => setHoveredAtom(atom.id)}
                onMouseLeave={() => setHoveredAtom(null)}
                className="cursor-pointer transition-transform duration-200"
                style={{ transformOrigin: `${atom.x}px ${atom.y}px`, transformBox: 'fill-box' }}
            >
              {/* Background Circle to hide bonds behind text */}
              <circle 
                r={radius} 
                fill="white" 
                stroke={isHovered ? "#6366f1" : "transparent"}
                strokeWidth="2"
              />
              
              {/* Element Text */}
              <text
                textAnchor="middle"
                dy="0.35em"
                fontSize={isHydrogen ? "12" : "14"}
                fontWeight="700"
                fill={atomColor.color === '#FFFFFF' ? '#0f172a' : '#0f172a'}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {atom.element}
              </text>

              {/* Lone Pairs */}
              {showLonePairs && atom.lonePairs > 0 && (
                <g transform={`translate(0, -${radius + 4})`}>
                   {Array.from({ length: atom.lonePairs }).map((_, i) => {
                       // Distribute lone pairs
                       const angle = (i * 2 * Math.PI) / Math.max(atom.lonePairs, 1) - Math.PI / 2;
                       const dist = 6;
                       return (
                           <g key={i} transform={`rotate(${(angle * 180) / Math.PI}) translate(0, -${dist})`}>
                               <circle r="1.8" fill="#64748b" cx="-2.5" />
                               <circle r="1.8" fill="#64748b" cx="2.5" />
                           </g>
                       )
                   })}
                </g>
              )}

              {/* Charge */}
              {showCharges && atom.charge !== 0 && (
                  <g transform={`translate(${radius - 4}, -${radius - 4})`}>
                      <circle r="6" fill={atom.charge > 0 ? "#ef4444" : "#3b82f6"} stroke="white" strokeWidth="1"/>
                      <text
                        textAnchor="middle"
                        dy="0.35em"
                        fontSize="8"
                        fill="white"
                        fontWeight="bold"
                      >
                          {atom.charge > 0 ? "+" : "-"}
                      </text>
                  </g>
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Interaction Tooltip */}
      {hoveredAtom !== null && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs px-4 py-2 rounded-lg shadow-xl pointer-events-none z-10 whitespace-nowrap backdrop-blur-sm transition-opacity">
            <span className="font-bold text-indigo-300 text-sm">
                {data.atoms.find(a => a.id === hoveredAtom)?.element}
            </span>
            <span className="mx-2 text-slate-500">|</span>
            Charge: <span className={data.atoms.find(a => a.id === hoveredAtom)?.charge! > 0 ? "text-red-400" : data.atoms.find(a => a.id === hoveredAtom)?.charge! < 0 ? "text-blue-400" : "text-slate-300"}>{data.atoms.find(a => a.id === hoveredAtom)?.charge}</span>
            <span className="mx-2 text-slate-500">|</span>
            Lone Pairs: <span className="text-slate-300">{data.atoms.find(a => a.id === hoveredAtom)?.lonePairs}</span>
        </div>
      )}
    </div>
  );
};

export default LewisStructure;