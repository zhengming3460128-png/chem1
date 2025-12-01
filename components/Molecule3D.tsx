import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MoleculeData, CPK_COLORS, Atom } from '../types';

// Fix for TypeScript errors regarding missing JSX intrinsic elements for React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      cylinderGeometry: any;
      ambientLight: any;
      spotLight: any;
      pointLight: any;
    }
  }
}

interface Molecule3DProps {
  data: MoleculeData;
  showLabels: boolean;
}

const AtomMesh: React.FC<{ atom: Atom; showLabel: boolean }> = ({ atom, showLabel }) => {
    const cpk = CPK_COLORS[atom.element.toUpperCase()] || CPK_COLORS.DEFAULT;
    const color = cpk.color;
    // Scale radius down slightly for better visibility of bonds
    const radius = cpk.radius * 0.4; 

    return (
        <group position={[atom.x3d, atom.y3d, atom.z3d]}>
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[radius, 32, 32]} />
                <meshStandardMaterial 
                    color={color} 
                    roughness={0.3} 
                    metalness={0.2}
                />
            </mesh>
            {showLabel && (
                <Html distanceFactor={10}>
                    <div className="bg-black/50 text-white px-2 py-0.5 rounded text-xs font-bold backdrop-blur-sm">
                        {atom.element}
                    </div>
                </Html>
            )}
        </group>
    );
};

const BondMesh: React.FC<{ start: THREE.Vector3; end: THREE.Vector3; order: number }> = ({ start, end, order }) => {
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const diff = new THREE.Vector3().subVectors(end, start);
    const length = diff.length();
    
    // Create quaternion to rotate cylinder to align with bond direction
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, diff.normalize());

    const radius = 0.08;
    const offset = 0.15; // Separation for multiple bonds

    const bonds = [];
    
    if (order === 1) {
        bonds.push(<mesh key="1" position={mid} quaternion={quaternion}>
            <cylinderGeometry args={[radius, radius, length, 16]} />
            <meshStandardMaterial color="#cbd5e1" />
        </mesh>);
    } else if (order === 2) {
        // Double bond: two cylinders slightly offset
        const localX = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
        const pos1 = mid.clone().add(localX.clone().multiplyScalar(offset));
        const pos2 = mid.clone().add(localX.clone().multiplyScalar(-offset));
        
        bonds.push(
            <mesh key="d1" position={pos1} quaternion={quaternion}>
                 <cylinderGeometry args={[radius, radius, length, 16]} />
                 <meshStandardMaterial color="#cbd5e1" />
            </mesh>,
            <mesh key="d2" position={pos2} quaternion={quaternion}>
                 <cylinderGeometry args={[radius, radius, length, 16]} />
                 <meshStandardMaterial color="#cbd5e1" />
            </mesh>
        );
    } else {
        // Triple bond
        const localX = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
        const pos1 = mid.clone().add(localX.clone().multiplyScalar(offset));
        const pos2 = mid.clone().add(localX.clone().multiplyScalar(-offset));
        
        bonds.push(
            <mesh key="t1" position={mid} quaternion={quaternion}>
                 <cylinderGeometry args={[radius, radius, length, 16]} />
                 <meshStandardMaterial color="#cbd5e1" />
            </mesh>,
            <mesh key="t2" position={pos1} quaternion={quaternion}>
                 <cylinderGeometry args={[radius, radius, length, 16]} />
                 <meshStandardMaterial color="#cbd5e1" />
            </mesh>,
             <mesh key="t3" position={pos2} quaternion={quaternion}>
                 <cylinderGeometry args={[radius, radius, length, 16]} />
                 <meshStandardMaterial color="#cbd5e1" />
            </mesh>
        );
    }

    return <group>{bonds}</group>;
};

const RotatingGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * 0.1;
        }
    });
    return <group ref={ref}>{children}</group>
}

const Molecule3D: React.FC<Molecule3DProps> = ({ data, showLabels }) => {
  return (
    <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-inner relative">
        <Canvas shadows dpr={[1, 2]}>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
            <ambientLight intensity={0.6} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            
            <Environment preset="city" />

            <OrbitControls enableZoom={true} enablePan={false} minDistance={2} maxDistance={20} />

            <RotatingGroup>
                <group position={[0, 0, 0]}> {/* Center the molecule ideally, handled by camera or data centering */}
                    {data.atoms.map((atom) => (
                        <AtomMesh key={atom.id} atom={atom} showLabel={showLabels} />
                    ))}
                    {data.bonds.map((bond, idx) => {
                        const startAtom = data.atoms[bond.source];
                        const endAtom = data.atoms[bond.target];
                        if (!startAtom || !endAtom) return null;
                        
                        const start = new THREE.Vector3(startAtom.x3d, startAtom.y3d, startAtom.z3d);
                        const end = new THREE.Vector3(endAtom.x3d, endAtom.y3d, endAtom.z3d);

                        return <BondMesh key={idx} start={start} end={end} order={bond.order} />;
                    })}
                </group>
            </RotatingGroup>
        </Canvas>
        
        <div className="absolute bottom-4 right-4 bg-black/40 text-white text-xs px-2 py-1 rounded backdrop-blur-md pointer-events-none">
            Interactive 3D View
        </div>
    </div>
  );
};

export default Molecule3D;