import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { carpetTexture, wallpaperTexture } from "@/game/textures";

/** Length of the Backrooms -> Tundra fall, in seconds. */
export const RIFT_DURATION = 11;

/**
 * The floor of the Backrooms cracks open; the camera falls through a
 * luminous temporal tunnel and lands on the glacial plain of -10 000.
 */
export function Rift({ onFinish }: { onFinish: () => void }) {
  const wall = useMemo(() => wallpaperTexture(1), []);
  const carpet = useMemo(() => carpetTexture(4), []);
  const elapsed = useRef(0);
  const done = useRef(false);
  const shards = useRef<THREE.Group>(null);
  const tunnel = useRef<THREE.Group>(null);
  const bg = useRef<THREE.Color>(new THREE.Color("#0d0b05"));
  const flashLight = useRef<THREE.PointLight>(null);

  const shardData = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    x: ((i % 6) - 2.5) * 1.3, z: (Math.floor(i / 6) - 2.5) * 1.3, spin: 0.5 + (i * 37 % 10) / 5, delay: (i * 13 % 17) / 17,
  })), []);
  const rings = useMemo(() => Array.from({ length: 28 }, (_, i) => i), []);

  useFrame(({ camera, scene }, raw) => {
    const d = Math.min(raw, 0.05);
    elapsed.current += d;
    const t = elapsed.current;
    const backroom = new THREE.Color("#0d0b05"), voidC = new THREE.Color("#04121c"), snow = new THREE.Color("#a9c0d8");
    if (t < 3) {
      // Standing in the corridor, the ground trembles.
      camera.position.set(Math.sin(t * 40) * 0.04 * t, 1.6, 4);
      camera.lookAt(0, 0.2 + t * 0.1, 0);
      bg.current.copy(backroom);
    } else if (t < 8.5) {
      // Freefall through the breach.
      const f = (t - 3) / 5.5;
      camera.position.set(Math.sin(t * 3) * 0.3, 1.6 - f * f * 80, 4 - f * 4);
      camera.lookAt(0, camera.position.y - 10, 0);
      camera.rotation.z += f * 0.02;
      bg.current.copy(backroom).lerp(voidC, Math.min(1, f * 3));
    } else {
      const f = Math.min(1, (t - 8.5) / 2.5);
      camera.position.set(0, -78 + f * 0.5, 0);
      camera.lookAt(0, -82, -6);
      bg.current.copy(voidC).lerp(snow, f);
    }
    scene.background = bg.current;
    if (shards.current) shards.current.children.forEach((c, i) => {
      const s = shardData[i]; if (!s) return;
      const local = Math.max(0, t - 2.6 - s.delay * 0.8);
      c.position.y = -0.1 - local * local * 4.5;
      c.rotation.set(local * s.spin, local * s.spin * 0.6, local * s.spin * 0.3);
    });
    if (tunnel.current) tunnel.current.rotation.y += d * 1.6;
    if (flashLight.current) flashLight.current.intensity = t > 8 && t < 9 ? 400 * (1 - Math.abs(t - 8.5) * 2) : 40;
    if (t >= RIFT_DURATION && !done.current) { done.current = true; onFinish(); }
  });

  return (
    <>
      <ambientLight intensity={1} color="#e8d08a" />
      <pointLight position={[0, 2.8, 2]} color="#ffdf9b" intensity={20} distance={14} />
      <pointLight ref={flashLight} position={[0, -40, 0]} color="#7fe6ff" intensity={40} distance={90} decay={1} />
      {/* corridor walls */}
      {[-1, 1].map(s => <mesh key={s} position={[s * 2, 1.6, 0]} rotation-y={-s * Math.PI / 2}><planeGeometry args={[20, 3.2]} /><meshStandardMaterial map={wall} color="#d8bc61" side={THREE.DoubleSide} /></mesh>)}
      <mesh position={[0, 3.2, 0]} rotation-x={Math.PI / 2}><planeGeometry args={[4, 20]} /><meshStandardMaterial color="#c8bd94" /></mesh>
      {/* breaking floor */}
      <group ref={shards}>
        {shardData.map((s, i) => <mesh key={i} position={[s.x, -0.1, s.z]}><boxGeometry args={[1.25, 0.2, 1.25]} /><meshStandardMaterial map={carpet} color="#a89042" /></mesh>)}
      </group>
      {/* glowing crack beneath */}
      <mesh position={[0, -0.6, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[3.4, 32]} /><meshBasicMaterial color="#5fe0ff" transparent opacity={0.85} /></mesh>
      {/* temporal tunnel */}
      <group ref={tunnel}>
        {rings.map(i => (
          <mesh key={i} position={[0, -6 - i * 2.6, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[4 + Math.sin(i) * 0.6, 0.06, 6, 48]} />
            <meshBasicMaterial color={i % 3 === 0 ? "#ffd27d" : "#6fe4ff"} transparent opacity={0.9 - i * 0.025} />
          </mesh>
        ))}
      </group>
      {/* landing: frozen plain */}
      <mesh position={[0, -82, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[300, 300]} /><meshStandardMaterial color="#e8f1fa" roughness={0.9} /></mesh>
      {[[-14, -40], [10, -30], [22, -55], [-30, -60]].map(([x, z]) => <mesh key={`${x}${z}`} position={[x ?? 0, -79, z ?? 0]}><dodecahedronGeometry args={[4, 0]} /><meshStandardMaterial color="#cfe0f0" /></mesh>)}
      <hemisphereLight args={["#cfe2f5", "#7d8ea3", 1.2]} position={[0, -70, 0]} />
    </>
  );
}
