'use client';

import { useEffect, useMemo } from 'react';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { ShaderChunk, Vector2, type MeshPhysicalMaterial } from 'three';
import { BOTTLE_CENTER, createBottleGeometry, createCapGeometry, createOilGeometry } from './bottle-geometry';

// Annular sleeve collar for tamper band (leaves inside of neck open)
const tamperProfile = [[.212, 3.660], [.234, 3.660], [.236, 3.668], [.236, 3.698], [.234, 3.704], [.212, 3.704]]
  .map(([r, y]) => new Vector2(r, y));

const oilOptics: MeshPhysicalMaterial['onBeforeCompile'] = shader => {
  // Gentle optical depth gradient across curved liquid cylinder without suffocating grazing light
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <transmission_fragment>',
    ShaderChunk.transmission_fragment.replace(
      'material.thickness = thickness;',
      'material.thickness = thickness * (0.65 + 0.55 * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 1.4));',
    ),
  );
};

export default function ProceduralBottle() {
  const bottle = useMemo(() => createBottleGeometry(), []);
  const oil = useMemo(() => createOilGeometry(), []);
  const cap = useMemo(() => createCapGeometry(), []);

  // Objects supplied as mesh props are owned here, unlike declarative R3F
  // geometry children. Release their GPU buffers on retry/navigation/unmount.
  useEffect(() => () => { bottle.dispose(); oil.dispose(); cap.dispose(); }, [bottle, oil, cap]);

  return (
    <group position={[0, -BOTTLE_CENTER, 0]} rotation={[0, .22, 0]}>
      {/* Luminous, crystal-clear golden edible peanut oil with authentic warm amber Beer-Lambert depth */}
      <mesh name="golden-oil" geometry={oil}>
        <meshPhysicalMaterial
          color="#fffaea"
          metalness={0}
          roughness={0.01}
          transmission={1.0}
          thickness={0.82}
          ior={1.472}
          attenuationColor="#f59e0b"
          attenuationDistance={0.72}
          envMapIntensity={1.4}
          specularIntensity={1.0}
          specularColor="#ffffff"
          clearcoat={0.3}
          clearcoatRoughness={0.02}
          onBeforeCompile={oilOptics}
        />
      </mesh>
      {/* High-clarity PET bottle: thin clear shell, crisp vertical highlights, true specular gloss */}
      <mesh name="pet-bottle" geometry={bottle}>
        <MeshTransmissionMaterial
          resolution={1024}
          samples={1}
          transmission={1.0}
          thickness={0.010}
          ior={1.53}
          roughness={0.0}
          color="#ffffff"
          envMapIntensity={1.2}
          specularColor="#ffffff"
          clearcoat={1.0}
          clearcoatRoughness={0.01}
          chromaticAberration={0.002}
          anisotropicBlur={0}
          distortion={0}
          temporalDistortion={0}
        />
      </mesh>
      {/* White ribbed molded cap with fine knurling */}
      <mesh name="white-ribbed-cap" geometry={cap}>
        <meshPhysicalMaterial
          color="#fcfbf9"
          roughness={0.28}
          metalness={0.0}
          clearcoat={0.2}
          clearcoatRoughness={0.2}
          envMapIntensity={0.9}
        />
      </mesh>
      {/* Tamper-evident band below cap */}
      <mesh name="tamper-band">
        <latheGeometry args={[tamperProfile, 64]} />
        <meshStandardMaterial color="#f2eee7" roughness={0.35} />
      </mesh>
    </group>
  );
}
