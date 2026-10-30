import { CELL, at, cellToWorld, type World } from "./maze";

export interface ClueMark { x: number; z: number; ry: number; label: string }

/**
 * Wall marks along a route: at each turn, an arrow painted on the wall the
 * player faces, pointing toward the next corridor. The last mark sits at the goal.
 */
export function clueMarks(world: World, route: { x: number; z: number }[], every = 1): ClueMark[] {
  const marks: ClueMark[] = [];
  let turn = 0;
  for (let i = 1; i < route.length - 1; i++) {
    const a = route[i - 1], p = route[i], b = route[i + 1];
    if (!a || !p || !b) continue;
    const dx = p.x - a.x, dz = p.z - a.z, ox = b.x - p.x, oz = b.z - p.z;
    if (dx === ox && dz === oz) continue;
    if (!at(world, p.x + dx, p.z + dz)) continue; // needs a wall straight ahead to paint on
    if (turn++ % every !== 0) continue;
    const c = cellToWorld(world.size, p.x, p.z);
    const right = ox === -dz && oz === dx;
    marks.push({ x: c.x + dx * (CELL / 2 - 0.02), z: c.z + dz * (CELL / 2 - 0.02), ry: Math.atan2(-dx, -dz), label: right ? "→" : "←" });
  }
  return marks;
}
