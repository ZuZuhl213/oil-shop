import { describe, expect, it } from 'vitest';
import { Vector3, type BufferGeometry } from 'three';
import { createBottleGeometry, createOilGeometry } from './bottle-geometry';

function volume(geometry: BufferGeometry) {
  const positions = geometry.getAttribute('position');
  const indices = geometry.index!;
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  let result = 0;
  for (let i = 0; i < indices.count; i += 3) {
    a.fromBufferAttribute(positions, indices.getX(i));
    b.fromBufferAttribute(positions, indices.getX(i + 1));
    c.fromBufferAttribute(positions, indices.getX(i + 2));
    result += a.dot(b.cross(c)) / 6;
  }
  return result;
}

describe('procedural bottle volumes', () => {
  it('leaves a shoulder air gap with approximately 90% oil by enclosed volume', () => {
    const bottle = createBottleGeometry();
    const oil = createOilGeometry();
    bottle.computeBoundingBox();
    oil.computeBoundingBox();
    expect(volume(bottle)).toBeGreaterThan(0); // outward face winding
    expect(volume(oil) / volume(bottle)).toBeGreaterThan(.87);
    expect(volume(oil) / volume(bottle)).toBeLessThan(.93);
    expect(oil.boundingBox!.max.y).toBeGreaterThan(2.8);
    expect(oil.boundingBox!.max.y).toBeLessThan(3.35);
    expect(oil.boundingBox!.min.y).toBeGreaterThan(bottle.boundingBox!.min.y);
    expect(oil.boundingBox!.max.x).toBeLessThan(bottle.boundingBox!.max.x);
    bottle.dispose(); oil.dispose();
  });

  it('produces finite, smooth normals and a bounded triangle budget', () => {
    for (const geometry of [createBottleGeometry(), createOilGeometry()]) {
      expect(geometry.index!.count / 3).toBeLessThan(65_000);
      const positions = geometry.getAttribute('position');
      const normals = geometry.getAttribute('normal');
      for (let i = 0; i < positions.count; i++) {
        expect(Number.isFinite(positions.getX(i) + positions.getY(i) + positions.getZ(i))).toBe(true);
        const normal = new Vector3().fromBufferAttribute(normals, i);
        expect(normal.length()).toBeCloseTo(1, 4);
      }
      geometry.dispose();
    }
  });
});
