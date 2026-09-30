'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { applyProps, Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import type { OrbitControls as Controls } from 'three-stdlib';
import {
  ACESFilmicToneMapping,
  BackSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SphereGeometry,
} from 'three';
import { ChevronDown, ChevronUp, Minus, Plus, RotateCcw, RotateCw } from 'lucide-react';
import BottleFallback from './BottleFallback';
import ProceduralBottle from './ProceduralBottle';
import styles from './BottleViewer.module.css';

function Lifecycle({ onReady, onLost }: { onReady: () => void; onLost: () => void }) {
  const gl = useThree(state => state.gl);
  const started = useRef(false);
  const frame = useRef(0);
  useFrame(() => {
    if (!started.current) {
      started.current = true;
      frame.current = requestAnimationFrame(onReady);
    }
  });
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      cancelAnimationFrame(frame.current);
      gl.domElement.removeEventListener('webglcontextlost', lost);
    };
  }, [gl, onLost]);
  return null;
}

function Studio() {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    // Custom offline studio HDRI environment:
    // Built specifically for transparent PET plastic and golden edible oil.
    // A dark studio enclosure ensures PET reflections only pick up dedicated softboxes
    // instead of a flat foggy white haze.
    const studioScene = new Scene();

    // Dark studio room walls & ceiling
    const domeGeo = new SphereGeometry(15, 32, 16);
    const domeMat = new MeshBasicMaterial({ color: '#1a1917', side: BackSide });
    studioScene.add(new Mesh(domeGeo, domeMat));

    // Dark floor flag
    const flagGeo = new PlaneGeometry(12, 12);
    const flagMat = new MeshBasicMaterial({ color: '#121110' });
    const flagFloor = new Mesh(flagGeo, flagMat);
    flagFloor.position.set(0, -4, 0);
    flagFloor.rotation.x = -Math.PI / 2;
    studioScene.add(flagFloor);

    // Left vertical strip softbox - crisp contour highlight on left flank
    const stripLGeo = new PlaneGeometry(0.9, 14);
    const stripLMat = new MeshBasicMaterial({ color: '#ffffff' });
    const stripL = new Mesh(stripLGeo, stripLMat);
    stripL.position.set(-4.5, 2.0, 1.8);
    stripL.rotation.y = Math.PI / 4;
    studioScene.add(stripL);

    // Right vertical strip softbox - crisp contour highlight on right flank
    const stripRGeo = new PlaneGeometry(0.8, 14);
    const stripRMat = new MeshBasicMaterial({ color: '#ffffff' });
    const stripR = new Mesh(stripRGeo, stripRMat);
    stripR.position.set(4.5, 2.0, 1.8);
    stripR.rotation.y = -Math.PI / 4;
    studioScene.add(stripR);

    // Warm backlight diffusion panel - shines warm radiant light through the liquid oil
    const backGeo = new PlaneGeometry(5.5, 9);
    const backMat = new MeshBasicMaterial({ color: '#fff0d0' });
    const backMesh = new Mesh(backGeo, backMat);
    backMesh.position.set(0, 2.0, -5.0);
    studioScene.add(backMesh);

    // Overhead softbox - clean highlight for cap, rim, and shoulder
    const topGeo = new PlaneGeometry(5.0, 5.0);
    const topMat = new MeshBasicMaterial({ color: '#ffffff' });
    const topMesh = new Mesh(topGeo, topMat);
    topMesh.position.set(0, 7.0, 0.5);
    topMesh.rotation.x = Math.PI / 2;
    studioScene.add(topMesh);

    const generator = new PMREMGenerator(gl);
    const environment = generator.fromScene(studioScene, 0.04);
    const previous = scene.environment;
    applyProps(scene, { environment: environment.texture });
    invalidate();

    return () => {
      applyProps(scene, { environment: previous });
      environment.dispose();
      generator.dispose();
      domeGeo.dispose(); domeMat.dispose();
      flagGeo.dispose(); flagMat.dispose();
      stripLGeo.dispose(); stripLMat.dispose();
      stripRGeo.dispose(); stripRMat.dispose();
      backGeo.dispose(); backMat.dispose();
      topGeo.dispose(); topMat.dispose();
    };
  }, [gl, scene, invalidate]);

  return (
    <>
      <color attach="background" args={['#eee9df']} />
      <ambientLight intensity={0.35} />
      {/* Front key light for crisp specular highlight on shoulder & cap */}
      <directionalLight position={[2.8, 4.5, 3.8]} intensity={2.2} color="#fffcf5" />
      {/* Liquid backlight shining through the golden oil */}
      <directionalLight position={[0, 1.8, -4.5]} intensity={3.0} color="#ffebbf" />
      {/* Left rim light for clear plastic edge definition */}
      <directionalLight position={[-3.8, 2.2, 1.2]} intensity={1.5} color="#f0f5ff" />
      {/* Contact shadow */}
      <ContactShadows
        position={[0, -1.987, 0]}
        opacity={0.4}
        scale={5.5}
        blur={2.2}
        far={4.0}
        resolution={512}
        frames={1}
        color="#3e2e1c"
      />
    </>
  );
}

export default function BottleCanvas({ label, fallback }: { label: string; fallback: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const controls = useRef<Controls>(null);
  const hintId = useId();
  const onReady = useCallback(() => setReady(true), []);
  const onLost = useCallback(() => setLost(true), []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  function rotate(amount: number) {
    const orbit = controls.current;
    if (orbit) orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + amount);
  }
  function zoom(inward: boolean) {
    const orbit = controls.current;
    if (!orbit) return;
    if (inward) orbit.dollyIn(1 / 1.15); else orbit.dollyOut(1 / 1.15);
    orbit.update();
  }
  function tilt(amount: number) {
    const orbit = controls.current;
    if (orbit) orbit.setPolarAngle(Math.max(.06, Math.min(Math.PI - .06, orbit.getPolarAngle() + amount)));
  }
  function reset() {
    const orbit = controls.current;
    if (!orbit) return;
    // Flush residual damping so reset is deterministic even during a drag.
    const damping = orbit.enableDamping;
    orbit.enableDamping = false;
    orbit.update();
    orbit.reset();
    orbit.enableDamping = damping;
  }
  if (lost) return fallback;

  return (
    <>
      <div className={styles.stage} data-ready={ready}>
        <Canvas
          role="img" aria-label={label} aria-describedby={hintId}
          frameloop="demand" dpr={[1, 1.5]}
          camera={{ position: [0, .18, 8.5], fov: 34, near: .1, far: 40 }}
          gl={{ antialias: true, powerPreference: 'low-power', toneMapping: ACESFilmicToneMapping }}
          onCreated={({ gl }) => { gl.debug.onShaderError = onLost; }}
          fallback={<BottleFallback label={label} message="Trình duyệt không hỗ trợ WebGL. Đang hiển thị ảnh tĩnh." />}
        >
          <Studio />
          <ProceduralBottle />
          <OrbitControls
            ref={controls} makeDefault enablePan={false}
            enableDamping={!reducedMotion} dampingFactor={.15} rotateSpeed={.7} zoomSpeed={.8}
            minDistance={5.5} maxDistance={11.5} minPolarAngle={.06} maxPolarAngle={Math.PI - .06}
          />
          <Lifecycle onReady={onReady} onLost={onLost} />
        </Canvas>
        {!ready && <BottleFallback label={label} message="Đang dựng chai dầu 3D…" />}
      </div>
      <div className={styles.toolbar} aria-label="Điều khiển góc nhìn">
        <div className={styles.controlGroup}>
          <button disabled={!ready} type="button" aria-label="Xoay trái" onClick={() => rotate(-Math.PI / 4)}><RotateCcw size={18} aria-hidden="true" /></button>
          <button disabled={!ready} type="button" aria-label="Xoay phải" onClick={() => rotate(Math.PI / 4)}><RotateCw size={18} aria-hidden="true" /></button>
          <button disabled={!ready} type="button" aria-label="Nhìn từ trên" onClick={() => tilt(-Math.PI / 8)}><ChevronUp size={18} aria-hidden="true" /></button>
          <button disabled={!ready} type="button" aria-label="Nhìn từ dưới" onClick={() => tilt(Math.PI / 8)}><ChevronDown size={18} aria-hidden="true" /></button>
          <span className={styles.divider} />
          <button disabled={!ready} type="button" aria-label="Thu nhỏ" onClick={() => zoom(false)}><Minus size={18} aria-hidden="true" /></button>
          <button disabled={!ready} type="button" aria-label="Phóng to" onClick={() => zoom(true)}><Plus size={18} aria-hidden="true" /></button>
        </div>
        <button className={styles.reset} disabled={!ready} type="button" onClick={reset}><RotateCcw size={16} aria-hidden="true" /> Đặt lại góc nhìn</button>
      </div>
      <p className={styles.hint} id={hintId}>Kéo hoặc vuốt để xoay 360°. Cuộn hoặc chụm hai ngón để thu phóng. Có thể dùng các nút bằng bàn phím.</p>
    </>
  );
}
