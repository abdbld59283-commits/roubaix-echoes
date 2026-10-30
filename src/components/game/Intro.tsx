import { useFrame } from "@react-three/fiber";
import { Environment, Html, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { asphaltTexture, brickTexture } from "@/game/textures";
import { AssetModel, MODELS } from "./AssetModel";

/** Length of the opening fly-over, in seconds. */
export const INTRO_DURATION = 26;

export const INTRO_LINES = [
  "ROUBAIX · 23 OCTOBRE 2026 · 19:42",
  "Ta sœur Inès a disparu dans l'ancienne filature Motte-Bossut il y a trois jours.",
  "Son dernier message : « Les murs bourdonnent. Il y a quelque chose derrière. »",
  "La police a classé l'affaire. Pas toi.",
  "Ce soir, la brume monte du canal. La porte de la filature est entrouverte.",
];

const CAR_COLORS = ["#5a1f1b", "#2b3a44", "#c9b48a", "#1c1c1f", "#6b6f72"];
const WALKER_MODELS: (keyof typeof MODELS)[] = ["aela", "narek", "sila"];

function Car({ position, color, speed }: { position: [number, number, number]; color: string; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    const g = ref.current; if (!g) return;
    g.position.z += speed * Math.min(d, 0.05);
    if (g.position.z > 60) g.position.z = -60;
    if (g.position.z < -60) g.position.z = 60;
  });
  return (
    <group ref={ref} position={position} rotation-y={speed > 0 ? 0 : Math.PI}>
      <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[1.8, 0.7, 4.2]} /><meshStandardMaterial color={color} metalness={0.6} roughness={0.35} /></mesh>
      <mesh position={[0, 1.15, -0.2]} castShadow><boxGeometry args={[1.6, 0.55, 2.2]} /><meshStandardMaterial color="#1a2026" metalness={0.9} roughness={0.1} /></mesh>
      {[-0.7, 0.7].map(x => <mesh key={x} position={[x, 0.6, 2.12]}><boxGeometry args={[0.35, 0.18, 0.05]} /><meshBasicMaterial color="#fff2c4" /></mesh>)}
      {[-0.7, 0.7].map(x => <mesh key={`r${x}`} position={[x, 0.6, -2.12]}><boxGeometry args={[0.35, 0.15, 0.05]} /><meshBasicMaterial color="#ff2a1a" /></mesh>)}
      {([[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.4], [0.9, -1.4]] as const).map(([x, z]) => <mesh key={`${x}${z}`} position={[x, 0.32, z]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.32, 0.32, 0.25, 12]} /><meshStandardMaterial color="#111" /></mesh>)}
    </group>
  );
}

function Walker({ model, start, speed, x }: { model: keyof typeof MODELS; start: number; speed: number; x: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s, d) => {
    const g = ref.current; if (!g) return;
    g.position.z += speed * Math.min(d, 0.05);
    if (g.position.z > 50) g.position.z = -50;
    if (g.position.z < -50) g.position.z = 50;
    g.position.y = Math.abs(Math.sin(s.clock.elapsedTime * 6 + start)) * 0.05;
  });
  return <group ref={ref} position={[x, 0, start]} rotation-y={speed > 0 ? 0 : Math.PI}><AssetModel model={model} height={1.75} /></group>;
}

function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.4, 0]}><cylinderGeometry args={[0.06, 0.09, 4.8, 8]} /><meshStandardMaterial color="#1d1f22" metalness={0.8} roughness={0.4} /></mesh>
      <mesh position={[0, 4.85, 0]}><sphereGeometry args={[0.22, 12, 12]} /><meshBasicMaterial color="#ffc477" /></mesh>
      <pointLight position={[0, 4.6, 0]} color="#ffb766" intensity={18} distance={13} decay={1.6} />
    </group>
  );
}

/** Living Roubaix street at dusk: brick terraces, cars, walkers, lamps and canal mist. */
export function IntroCity({ onFinish }: { onFinish: () => void }) {
  const brick = useMemo(() => brickTexture(3), []);
  const paving = useMemo(() => { const t = asphaltTexture(24); return t; }, []);
  const elapsed = useRef(0);
  const done = useRef(false);

  useFrame(({ camera }, raw) => {
    const d = Math.min(raw, 0.05);
    elapsed.current += d;
    const t = Math.min(1, elapsed.current / INTRO_DURATION);
    const e = t * t * (3 - 2 * t);
    // High crane shot sweeping down the street toward the mill door.
    camera.position.set(Math.sin(e * 2.2) * 5, 14 - e * 12.3, 45 - e * 76);
    camera.lookAt(Math.sin(e * 2.2) * 2, 2 - e * 0.4, 20 - e * 66);
    if (elapsed.current >= INTRO_DURATION && !done.current) { done.current = true; onFinish(); }
  });

  const terraces = [-1, 1].flatMap(side => Array.from({ length: 11 }, (_, i) => ({ side, z: -50 + i * 9.5, h: 6.5 + ((i * 7 + side) % 3) * 1.6 })));

  return (
    <>
      <color attach="background" args={["#2a2730"]} />
      <fog attach="fog" args={["#4a3c3f", 8, 70]} />
      <hemisphereLight args={["#ff9d6c", "#1b1d26", 0.9]} />
      <directionalLight position={[-30, 8, -40]} color="#ff8a4c" intensity={1.6} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} />
      <Environment resolution={64}><Lightformer intensity={1.4} color="#ff9a5e" position={[0, 6, -60]} scale={[60, 10, 1]} /><Lightformer intensity={0.6} color="#6d7f99" position={[0, 20, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} /></Environment>

      {/* wet cobbles reflect lamps */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[60, 130]} /><meshStandardMaterial map={paving} color="#4a4549" roughness={0.25} metalness={0.35} /></mesh>
      {[-1, 1].map(s => <mesh key={s} position={[s * 6.2, 0.08, 0]} receiveShadow><boxGeometry args={[2.4, 0.16, 130]} /><meshStandardMaterial color="#5f5753" roughness={0.8} /></mesh>)}

      {/* Brick terraced houses ("maisons de courées") */}
      {terraces.map(({ side, z, h }) => (
        <group key={`${side}${z}`} position={[side * 11.5, 0, z]}>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[6, h, 9]} /><meshStandardMaterial map={brick} color="#9a5a44" roughness={0.85} /></mesh>
          <mesh position={[0, h + 0.9, 0]} rotation-z={Math.PI / 4} castShadow><boxGeometry args={[4.3, 4.3, 9.1]} /><meshStandardMaterial color="#2c2a2e" roughness={0.7} /></mesh>
          {[-2.6, 0, 2.6].map(wz => [2.2, 5].filter(y => y < h - 0.8).map(y => (
            <mesh key={`${wz}${y}`} position={[-side * 3.02, y, wz]} rotation-y={-side * Math.PI / 2}>
              <planeGeometry args={[1.2, 1.7]} />
              <meshStandardMaterial color="#ffb867" emissive="#ff9a3d" emissiveIntensity={((z * 13 + wz * 7 + y) | 0) % 3 === 0 ? 1.6 : 0.05} />
            </mesh>
          )))}
        </group>
      ))}

      {/* Mill chimney + façade at the end of the street */}
      <group position={[0, 0, -64]}>
        <mesh position={[0, 9, 0]} castShadow><boxGeometry args={[34, 18, 6]} /><meshStandardMaterial map={brick} color="#7d3f2e" /></mesh>
        <mesh position={[11, 22, -2]} castShadow><cylinderGeometry args={[1.4, 2.2, 44, 16]} /><meshStandardMaterial map={brick} color="#6b3526" /></mesh>
        <mesh position={[0, 2.4, 3.05]}><planeGeometry args={[3, 4.8]} /><meshStandardMaterial color="#0a1418" emissive="#3fd4ff" emissiveIntensity={1.2} /></mesh>
        <pointLight position={[0, 2.5, 5]} color="#5fdcff" intensity={30} distance={14} />
        <Html position={[0, 14, 3.2]} center distanceFactor={30} transform><span className="wall-sign">FILATURE MOTTE-BOSSUT</span></Html>
        <Html position={[-6, 3, 3.2]} center distanceFactor={14} transform><span className="graffiti">INÈS ÉTAIT ICI →</span></Html>
      </group>

      {[-1, 1].flatMap(s => [-40, -24, -8, 8, 24, 40].map(z => <StreetLamp key={`${s}${z}`} position={[s * 6.8, 0, z + s * 4]} />))}

      <Suspense fallback={null}>
        {CAR_COLORS.map((c, i) => <Car key={c} color={c} position={[i % 2 ? 2.2 : -2.2, 0, -50 + i * 23]} speed={i % 2 ? 7 + i : -(6 + i)} />)}
        {[-1, 1].map(s => <group key={`p${s}`} position={[s * 7.8, 0, -18]} rotation-y={s * Math.PI / 2}><AssetModel model="tree" height={5} /></group>)}
        {Array.from({ length: 7 }, (_, i) => (
          <Walker key={i} model={WALKER_MODELS[i % 3] ?? "aela"} x={(i % 2 ? 1 : -1) * (5.6 + (i % 3) * 0.4)} start={-40 + i * 13} speed={(i % 2 ? 1 : -1) * (1.2 + (i % 3) * 0.25)} />
        ))}
      </Suspense>

    </>
  );
}

/** Typewriter narration shown over the fly-over. */
export function Typewriter({ lines, perChar = 38, gap = 900 }: { lines: string[]; perChar?: number; gap?: number }) {
  const [shown, setShown] = useState<string[]>([]);
  useEffect(() => {
    let line = 0, char = 0, id = 0;
    const tick = () => {
      const current = lines[line]; if (current === undefined) return;
      char++;
      setShown(prev => { const next = prev.slice(0, line); next[line] = current.slice(0, char); return next; });
      if (char >= current.length) { line++; char = 0; id = window.setTimeout(tick, gap); }
      else id = window.setTimeout(tick, perChar);
    };
    id = window.setTimeout(tick, 600);
    return () => window.clearTimeout(id);
  }, [lines, perChar, gap]);
  return (
    <div className="typewriter" aria-live="polite">
      {shown.map((l, i) => <p key={i} className={i === 0 ? "typewriter-stamp" : undefined}>{l}{i === shown.length - 1 && <span className="typewriter-caret">▌</span>}</p>)}
    </div>
  );
}
