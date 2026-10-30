import { Html } from "@react-three/drei";
import { useMemo } from "react";
import { CELL, at, cellToWorld, routeToGoal, type World } from "@/game/maze";
import { clueMarks } from "@/game/clues";
import { CrtScreen } from "./Atmosphere";

/**
 * Hints painted on the Backrooms walls instead of floating help text:
 * the quest title in chalk at the spawn, then arrows at each turn of the route.
 */
export function WallClues({ world, title, hint, every = 1 }: { world: World; title: string; hint?: string; every?: number }) {
  const marks = useMemo(() => clueMarks(world, routeToGoal(world), every), [world, every]);
  const spawnWall = useMemo(() => {
    const { x, z } = world.spawn;
    for (const [dx, dz] of [[0, -1], [-1, 0], [1, 0], [0, 1]] as const) if (at(world, x + dx, z + dz)) {
      const p = cellToWorld(world.size, x, z);
      return { x: p.x + dx * (CELL / 2 - 0.02), z: p.z + dz * (CELL / 2 - 0.02), ry: Math.atan2(-dx, -dz), cx: p.x + dx * (CELL / 2 - 0.45) + dz * 1.1, cz: p.z + dz * (CELL / 2 - 0.45) + dx * 1.1 };
    }
    return null;
  }, [world]);
  return (
    <group>
      {spawnWall && <Html transform position={[spawnWall.x, 1.9, spawnWall.z]} rotation-y={spawnWall.ry} distanceFactor={3} occlude="blending" pointerEvents="none"><span className="chalk">{title}</span></Html>}
      {spawnWall && hint && <CrtScreen position={[spawnWall.cx, 0.35, spawnWall.cz]} rotationY={spawnWall.ry} text={hint} />}
      {marks.map((m, i) => (
        <Html key={i} transform position={[m.x, 1.3, m.z]} rotation-y={m.ry} distanceFactor={3} occlude="blending" pointerEvents="none">
          <span className="graffiti graffiti-arrow">{m.label}</span>
        </Html>
      ))}
    </group>
  );
}
