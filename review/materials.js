import * as THREE from 'three';

// Capture-owned approximations only. The ordinary renderer never imports this.
export function usesProjectedTexture(material, geometry) {
  const uniforms = material.userData?.uniforms || {};
  return !(material.map && geometry.attributes.uv) && Boolean(uniforms.uRockA || uniforms.uDirtA);
}

export function createReviewPreparation(yieldTask) {
  const prepared = new Map();
  const geometryCopies = new Map();
  const materialCopies = new Map();
  const alphaMaps = new Map();
  const ownedTextures = new Set();

  function alphaFor(texture, threshold) {
    const key = `${texture.uuid}:${threshold}`;
    if (alphaMaps.has(key)) return alphaMaps.get(key);
    const image = texture.image;
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d');
    let data = image.data;
    if (!data) {
      context.drawImage(image, 0, 0);
      data = context.getImageData(0, 0, image.width, image.height).data;
    }
    const pixels = new Uint8Array(image.width * image.height * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = pixels[i + 1] = pixels[i + 2] = data[i + 3] / 255 >= threshold ? 255 : 0;
      pixels[i + 3] = 255;
    }
    const map = new THREE.DataTexture(pixels, image.width, image.height, THREE.RGBAFormat);
    map.wrapS = texture.wrapS; map.wrapT = texture.wrapT; map.flipY = texture.flipY;
    map.repeat.copy(texture.repeat); map.needsUpdate = true;
    map.name = `Source alpha threshold ${threshold}`;
    alphaMaps.set(key, map); ownedTextures.add(map);
    return map;
  }

  async function geometryFor(mesh, signal) {
    if (!usesProjectedTexture(mesh.material, mesh.geometry)) return mesh.geometry;
    // World-space projection differs only when the same geometry has a different
    // world pose or projection rule. Otherwise retain one shared prepared copy.
    const rock = Boolean(mesh.material.userData.uniforms.uIron);
    const key = `${mesh.geometry.uuid}:${rock}:${mesh.matrixWorld.elements.join(',')}`;
    if (geometryCopies.has(key)) return geometryCopies.get(key);
    const geometry = mesh.geometry.clone();
    try {
      const p = geometry.attributes.position, n = geometry.attributes.normal;
      const uv = new Float32Array(p.count * 2), v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        if (i % 8192 === 0) { signal.throwIfAborted(); await yieldTask(); }
        v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld);
        let a = 0, b = 2;
        if (rock && n) {
          const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
          if (nx > ny && nx > nz) { a = 2; b = 1; }
          else if (nz > ny) { a = 0; b = 1; }
        }
        const scale = rock ? 0.0715 : 0.3846;
        uv[i * 2] = v.getComponent(a) * scale;
        uv[i * 2 + 1] = v.getComponent(b) * scale;
      }
      geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      signal.throwIfAborted();
      geometryCopies.set(key, geometry);
      return geometry;
    } catch (error) { geometry.dispose(); throw error; }
  }

  function materialFor(mesh, geometry) {
    const m = mesh.material, u = m.userData?.uniforms || {};
    // Keep the established per-renderable material feedback identity. Sharing
    // textures/geometry must not collapse independently named material targets.
    const key = `${mesh.uuid}:${Boolean(geometry.attributes.uv)}`;
    if (materialCopies.has(key)) return materialCopies.get(key);
    const out = new THREE.MeshStandardMaterial({
      name: `${m.name || mesh.name} — review shading approximation`,
      color: u.uIron?.value || m.color || new THREE.Color(0xb79068),
      roughness: m.roughness ?? 1, metalness: m.metalness ?? 0, side: m.side,
      transparent: m.transparent, opacity: m.opacity, alphaTest: m.alphaTest || 0,
      // A color attribute can hold shader masks. Preserve the source opt-in.
      vertexColors: m.vertexColors === true,
      emissive: m.emissive || 0x000000, emissiveIntensity: m.emissiveIntensity ?? 1,
    });
    for (const slot of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'alphaMap', 'emissiveMap']) {
      if (m[slot] && geometry.attributes.uv) out[slot] = m[slot];
    }
    if (!out.map && (u.uRockA || u.uDirtA)) out.map = (u.uRockA && u.uIron ? u.uRockA : u.uDirtA || u.uRockA).value;
    if (m.alphaTest > 0 && out.map) { out.alphaMap = alphaFor(out.map, m.alphaTest); out.transparent = true; }
    if (m.normalScale) out.normalScale.copy(m.normalScale);
    materialCopies.set(key, out);
    return out;
  }

  async function prepare(roots, signal) {
    if (prepared.has(roots)) return prepared.get(roots);
    const result = [];
    for (const source of roots) {
      signal.throwIfAborted(); await yieldTask(); source.updateMatrixWorld(true);
      const clone = source.clone(true); result.push(clone);
      const originals = [], clones = [];
      source.traverse(o => originals.push(o)); clone.traverse(o => clones.push(o));
      for (let i = 0; i < clones.length; i++) {
        const copy = clones[i], sourceMesh = originals[i];
        if (!copy.isMesh) continue;
        signal.throwIfAborted(); await yieldTask();
        copy.geometry = await geometryFor(sourceMesh, signal);
        copy.material = materialFor(sourceMesh, copy.geometry);
      }
    }
    signal.throwIfAborted(); prepared.set(roots, result);
    return result;
  }

  function dispose() {
    for (const material of materialCopies.values()) material.dispose();
    for (const geometry of geometryCopies.values()) geometry.dispose();
    for (const texture of ownedTextures) texture.dispose();
    materialCopies.clear(); geometryCopies.clear(); ownedTextures.clear();
    prepared.clear(); alphaMaps.clear();
  }
  return { prepare, dispose };
}
