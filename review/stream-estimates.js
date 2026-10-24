import {usesProjectedTexture} from './materials.js';

// SDK 0.9.0 keeps UVs and RGB/RGBA in both profiles; only supplied normals are
// detail-only. Texture transfer, decoded images and GPU storage are separate.
export function measureStreamRepresentations(roots) {
  let sceneBytes = 0, detailBytes = 0, triangles = 0, instances = 0, nodes = 0;
  const seen = new Set();
  const sceneAttributes = new Set(['position']);
  const detailAttributes = new Set(['position']);
  for (const root of roots) {
    root.updateMatrixWorld(true);
    root.traverse(object => {
      nodes++;
      const geometry = object.geometry;
      const position = geometry?.getAttribute('position');
      if (!position) return;
      const count = position.count;
      const copies = object.isInstancedMesh ? object.count : 1;
      triangles += Math.floor((geometry.index?.count ?? count) / 3) * copies;
      if (object.isInstancedMesh) {
        instances += object.count;
        const bytes = object.count * 16 * 4 + (object.instanceColor ? object.count * object.instanceColor.itemSize * 4 : 0);
        sceneBytes += bytes; detailBytes += bytes;
      }
      const projected = usesProjectedTexture(object.material, geometry);
      const key = projected
        ? `${geometry.uuid}:${Boolean(object.material.userData.uniforms.uIron)}:${object.matrixWorld.elements.join(',')}`
        : geometry.uuid;
      if (seen.has(key)) return;
      seen.add(key);
      const uv = projected || Boolean(geometry.getAttribute('uv'));
      const normal = Boolean(geometry.getAttribute('normal'));
      const color = geometry.getAttribute('color');
      const colors = color ? count * color.itemSize * 4 : 0;
      const base = count * 3 * 4 + (geometry.index?.count ?? 0) * (count <= 65535 ? 2 : 4) + (uv ? count * 2 * 4 : 0) + colors;
      sceneBytes += base; detailBytes += base + (normal ? count * 3 * 4 : 0);
      if (uv) { sceneAttributes.add('uv'); detailAttributes.add('uv'); }
      if (normal) detailAttributes.add('normal');
      if (color) { sceneAttributes.add('color'); detailAttributes.add('color'); }
    });
  }
  // Reserve metadata/object/map descriptors without multiplying shared storage
  // by placement count. This excludes texture bytes and image/GPU allocations.
  const reserve = bytes => Math.ceil(bytes * 1.25 + 65536 + nodes * 1024);
  return { triangles, instances, sceneBytes: reserve(sceneBytes), detailBytes: reserve(detailBytes),
    sceneAttributes: [...sceneAttributes], detailAttributes: [...detailAttributes] };
}
