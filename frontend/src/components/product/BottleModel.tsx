'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, MeshStandardMaterial, SRGBColorSpace, Vector2 } from 'three';

const profile = [
  [0, -1.3], [.35, -1.3], [.44, -1.24], [.46, -1.15], [.46, .45],
  [.44, .58], [.36, .72], [.2, .9], [.18, 1.02], [.18, 1.22], [0, 1.22],
].map(([radius, height]) => new Vector2(radius, height));

// Procedural placeholder: replace this component with the approved GLB model later.
export default function BottleModel({ angle }: { angle: number }) {
  const label = useRef<MeshStandardMaterial>(null);
  const invalidate = useThree(state => state.invalidate);
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 640;
    const context = canvas.getContext('2d');
    const material = label.current;
    if (!context || !material) return;
    context.fillStyle = '#faf6ee'; context.fillRect(0, 0, 512, 640);
    context.strokeStyle = '#c88b3a'; context.lineWidth = 5; context.strokeRect(24, 24, 464, 592);
    context.fillStyle = '#26402f'; context.textAlign = 'center';
    context.font = 'bold 42px Georgia'; context.fillText('HM NATURALS', 256, 138);
    context.font = '80px Georgia'; context.fillText('HM', 256, 325);
    context.fillStyle = '#c88b3a'; context.fillRect(110, 380, 292, 3);
    context.fillStyle = '#26402f'; context.font = '28px sans-serif';
    context.fillText('MÔ HÌNH MINH HỌA', 256, 470);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    material.map = texture; material.needsUpdate = true; invalidate();
    return () => { material.map = null; texture.dispose(); };
  }, [invalidate]);

  return (
    <group rotation={[0, angle * Math.PI / 180, 0]}>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[profile, 64]} />
        <meshPhysicalMaterial color="#a65e1c" roughness={0.22} metalness={0.18} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[.205, .205, .24, 48]} />
        <meshStandardMaterial color="#433022" roughness={.65} />
      </mesh>
      <mesh position={[0, 1.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[.203, .016, 8, 48]} />
        <meshStandardMaterial color="#c88b3a" metalness={.6} roughness={.3} />
      </mesh>
      <mesh position={[0, -.28, 0]}>
        <cylinderGeometry args={[.464, .464, 1.12, 48, 1, true, -.82, 1.64]} />
        <meshStandardMaterial ref={label} color="#ffffff" roughness={.85} />
      </mesh>
    </group>
  );
}
