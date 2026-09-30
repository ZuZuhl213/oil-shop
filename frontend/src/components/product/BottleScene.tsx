'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsHandle } from 'three-stdlib';
import { RotateCcw } from 'lucide-react';
import BottleModel from './BottleModel';
import styles from './Product360Modal.module.css';

function SceneLifecycle({ onReady, onLost }: { onReady: () => void; onLost: () => void }) {
  const canvas = useThree(state => state.gl.domElement);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    canvas.addEventListener('webglcontextlost', lost);
    onReady();
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [canvas, onReady, onLost]);
  return null;
}

export default function BottleScene({ fallback }: { fallback: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  const [angle, setAngle] = useState(0);
  const controls = useRef<OrbitControlsHandle>(null);
  const onReady = useCallback(() => setReady(true), []);
  const onLost = useCallback(() => setLost(true), []);
  if (lost) return fallback;

  return (
    <>
      <div className={styles.stage} aria-label="Mô hình chai dầu 3D">
        <Canvas shadows frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, .3, 5.8], fov: 35 }} gl={{ antialias: true, powerPreference: 'low-power' }}>
          <color attach="background" args={['#f0e7d9']} />
          <ambientLight intensity={1.2} />
          <directionalLight position={[3, 5, 4]} intensity={3} castShadow shadow-mapSize={[512, 512]} />
          <directionalLight position={[-3, 2, -2]} intensity={2} color="#fff0d4" />
          <BottleModel angle={angle} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.31, 0]} receiveShadow>
            <planeGeometry args={[200, 200]} />
            <shadowMaterial opacity={.15} />
          </mesh>
          <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping={false} minDistance={4.2} maxDistance={7} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI * .65} />
          <SceneLifecycle onReady={onReady} onLost={onLost} />
        </Canvas>
        {!ready && <p role="status" className={styles.loading}>Đang tải mô hình 3D…</p>}
      </div>
      <div className={styles.controls}>
        <label htmlFor="bottle-viewer-angle">Góc xoay: {angle}°</label>
        <input id="bottle-viewer-angle" type="range" min={0} max={360} step={15} value={angle} disabled={!ready} onChange={event => setAngle(Number(event.target.value))} />
        <button type="button" className={styles.reset} disabled={!ready} onClick={() => { setAngle(0); controls.current?.reset(); }}>
          <RotateCcw size={16} aria-hidden="true" /> Đặt lại góc nhìn
        </button>
      </div>
      <p className={styles.hint}>Kéo hoặc vuốt để xoay. Cuộn hoặc chụm hai ngón để thu phóng.</p>
    </>
  );
}
