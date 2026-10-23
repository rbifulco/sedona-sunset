// The SDK sends positions (and indices) in Scene, then adds normals, UVs,
// and texture references in Asset. Keep the metadata aligned with
// those profiles so the editor can budget a full-fidelity overview accurately.
export function measureStreamRepresentations(roots) {
  let sceneBytes = 0;
  let detailBytes = 0;
  let triangles = 0;
  let instances = 0;
  let nodes = 0;

  for (const root of roots) root.traverse((object) => {
    nodes++;
    const geometry = object.geometry;
    if (!geometry?.getAttribute('position')) return;
    const count = geometry.getAttribute('position').count;
    const copies = object.isInstancedMesh ? object.count : 1;
    triangles += Math.floor((geometry.index?.count ?? count) / 3) * copies;
    if (object.isInstancedMesh) {
      instances += object.count;
      // asset-stream-v1 transfers each 4x4 instance matrix as Float32.
      sceneBytes += object.count * 16 * 4;
      detailBytes += object.count * 16 * 4;
    }
    // Capture preparation clones geometry for each renderable. Two source
    // meshes can share one geometry but serialize separate review copies.
    const positions = count * 3 * 4;
    const indices = (geometry.index?.count ?? 0) * (count <= 65535 ? 2 : 4);
    sceneBytes += positions + indices;
    // Review preparation can add projected UVs to custom terrain/rock shaders.
    // Reserve both normals and UVs for every mesh, even when one is absent.
    detailBytes += positions + indices + count * (3 + 2) * 4;
  });

  // Transfer metadata, object keys, and small map descriptors are counted in
  // the SDK's structured-clone budget in addition to typed geometry buffers.
  // Keep a conservative margin without doubling large geometry allocations.
  const reserve = (bytes) => Math.ceil(bytes * 1.25 + 65536 + nodes * 1024);
  return {
    triangles,
    instances,
    sceneBytes: reserve(sceneBytes),
    detailBytes: reserve(detailBytes),
  };
}
