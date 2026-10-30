import { describe, it } from "node:test";
import { strictEqual, ok } from "node:assert";
import * as THREE from "three";
import { at, buildWorld, routeToGoal } from "./maze";
import { clueMarks } from "./clues";
import { shootTarget } from "./combat";
import { missionComplete } from "./survivors";
import { QUESTS } from "./quests";

describe("weapons, expanded tundra and accessible level two", () => {
  it("the pistol eliminates the target in front of the player", () => {
    const world = buildWorld("tundra", 7, 0);
    world.grid.fill(0);
    const object = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial());
    object.position.set(0, 1, -5);
    let hits = 0;
    strictEqual(shootTarget(world, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), [{ object, hit: () => hits++ }]), true);
    strictEqual(hits, 1);
    world.grid.fill(1);
    strictEqual(shootTarget(world, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), [{ object, hit: () => hits++ }]), false);
    strictEqual(hits, 1);
  });
  it("tundra is larger than the previous 23-cell map and camp and goal are reachable", () => {
    for (let seed = 0; seed < 30; seed++) {
      const world = buildWorld("tundra", seed, 8);
      ok(world.size > 23);
      ok(world.camp);
      ok(routeToGoal(world).length > 1);
      ok(routeToGoal(world, world.spawn, world.camp).length > 1);
    }
  });
  it("level two keeps its two monsters but slows them and hides its goal in a reachable side room", () => {
    strictEqual(QUESTS[1]?.monsters, 2);
    strictEqual(QUESTS[1]?.monsterSpeed, 2);
    for (let attempt = 0; attempt < 20; attempt++) {
      const world = buildWorld("backrooms", 2007 + attempt * 37, 2, true);
      const route = routeToGoal(world);
      ok(route.length > 1);
      const { x, z } = world.goal;
      const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx = 0, dz = 0]) => !at(world, x + dx, z + dz)).length;
      strictEqual(open, 1);
      ok(clueMarks(world, route).length > 0);
    }
  });
  it("survivor collection and hunt missions require their two objectives", () => {
    strictEqual(missionComplete("collect", 1, 2), false);
    strictEqual(missionComplete("collect", 2, 0), true);
    strictEqual(missionComplete("hunt", 2, 1), false);
    strictEqual(missionComplete("hunt", 0, 2), true);
  });
  it("Roubaix goal is the walkable central Grand-Place", () => {
    const world = buildWorld("roubaix", 7, 6);
    strictEqual(world.goal.x, Math.floor(world.size / 2));
    strictEqual(world.goal.z, Math.floor(world.size / 2));
    ok(routeToGoal(world).length > 1);
  });
});

describe("procedural spawns", () => {
  it("different run seeds move the backrooms goal", () => {
    const goals = new Set([1, 2, 3, 4, 5, 6].map(salt => { const g = buildWorld("backrooms", 1007 + salt * 7919, 1).goal; return `${g.x}:${g.z}`; }));
    ok(goals.size >= 3);
  });
});
