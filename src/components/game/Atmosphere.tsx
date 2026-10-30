import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

let disc: THREE.Texture | null = null;
function discTexture() {
  if (disc) return disc;
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const g = c.getContext("2d");
  if (g) { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }
  disc = new THREE.CanvasTexture(c);
  return disc;
}

/** Floating industrial dust around the player, kept out of the camera's clear radius. */
export function Dust({ playerPos, color = "#ffe2a8", count = 260, height = 3, clear = 2.5, opacity = 0.5 }: { playerPos?: THREE.Vector3; color?: string; count?: number; height?: number; clear?: number; opacity?: number }) {
  const ref = useRef<THREE.Points>(null);
  const seed = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { const r = clear + Math.random() * 16, t = Math.random() * Math.PI * 2; a[i * 3] = Math.cos(t) * r; a[i * 3 + 1] = Math.random() * height; a[i * 3 + 2] = Math.sin(t) * r; }
    return a;
  }, [count, height, clear]);
  const map = useMemo(() => discTexture(), []);
  useFrame((s) => {
    const p = ref.current; if (!p) return;
    const t = s.clock.elapsedTime;
    p.rotation.y = t * 0.015;
    p.position.y = Math.sin(t * 0.3) * 0.15;
    if (playerPos) { p.position.x = playerPos.x; p.position.z = playerPos.z; }
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[seed, 3]} /></bufferGeometry>
      <pointsMaterial map={map} color={color} size={0.06} transparent opacity={opacity} depthWrite={false} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Flickering cathode-ray screen showing a clue. */
export function CrtScreen({ position, rotationY = 0, text }: { position: [number, number, number]; rotationY?: number; text: string }) {
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((s) => { if (glow.current) glow.current.emissiveIntensity = 0.9 + Math.sin(s.clock.elapsedTime * 40) * 0.1 + (Math.random() < 0.03 ? -0.7 : 0); });
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh castShadow><boxGeometry args={[0.9, 0.7, 0.7]} /><meshStandardMaterial color="#2a2722" roughness={0.6} /></mesh>
      <mesh position={[0, 0.02, 0.351]}><planeGeometry args={[0.72, 0.52]} /><meshStandardMaterial ref={glow} color="#0c1d14" emissive="#4dff9a" emissiveIntensity={0.9} /></mesh>
      <pointLight position={[0, 0, 0.8]} color="#4dff9a" intensity={3} distance={4} />
      <Html transform position={[0, 0.02, 0.36]} distanceFactor={1.1} pointerEvents="none" occlude="blending"><div className="crt-text">{text}</div></Html>
    </group>
  );
}
