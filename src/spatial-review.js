import {
  SceneAssetRegistry,
  attachSceneAssetRegistryBridge,
  attachSpatialReviewDiscoveryBridge,
} from '@alterno-dev/spatial-review';

export const SPATIAL_REVIEW_BUILD_ID = 'sedona-sunset@1.0.1';
export const spatialReviewRegistry = new SceneAssetRegistry(SPATIAL_REVIEW_BUILD_ID);

/* The user explicitly approved the official editor on 2026-08-30. No other
   production editor origin is authorized. Loopback-to-loopback access remains
   available through the SDK for local verification. */
const authorizationOptions = Object.freeze({
  allowOfficialEditor: true,
  allowLoopbackPeers: true,
  allowedOrigins: Object.freeze([]),
});
const streamingBridgeOptions = Object.freeze({
  ...authorizationOptions,
  maxGeometryBytes: 64 * 1024 * 1024,
  maxConcurrentAssetRequests: 1,
  maxInFlightBytes: 64 * 1024 * 1024,
  maxQueuedAssetRequests: 20,
  progressIntervalMs: 120,
});

let detachDiscovery = null;
let detachCapture = null;
const reviewMaterialAppearances = new Map();

const reviewColors = Object.freeze({
  terrain: 0xa86242,
  sandstone: 0xa4492f,
  farRidge: 0x8f4c3b,
  clast: 0x84624f,
  wood: 0x4b3328,
  foliage: 0x4d5a32,
  hummock: 0x6c4936,
  litter: 0x705239,
  grass: 0xa69b68,
  scrub: 0x687552,
  succulent: 0x6f8d73,
  midJuniper: 0x3f4930,
  farJuniper: 0x303727,
});

function websiteRoot() {
  return new URL('./', window.location.href).href;
}

export function startSpatialReviewDiscovery() {
  if (detachDiscovery) return detachDiscovery;
  const websiteUrl = websiteRoot();
  detachDiscovery = attachSpatialReviewDiscoveryBridge({
    name: 'Sedona Sunset',
    websiteUrl,
    discoveryUrl: '.well-known/spatial-review.json',
    liveCapture: new URL('?spatial-review-capture=1', websiteUrl).href,
  }, authorizationOptions);
  return detachDiscovery;
}

export function isSpatialReviewCapture() {
  return new URLSearchParams(window.location.search)
    .get('spatial-review-capture') === '1';
}

export function startSpatialReviewCapture() {
  if (!isSpatialReviewCapture() || detachCapture) return detachCapture;
  if (spatialReviewRegistry.getSourceStatus?.().phase === 'booting') {
    spatialReviewRegistry.setSourceStatus({
      phase: 'catalog-ready',
      expectedActors: spatialReviewRegistry.size,
      readyActors: spatialReviewRegistry.size,
      message: 'Sedona roots are ready; geometry remains request-driven.',
    });
  }
  detachCapture = attachSceneAssetRegistryBridge(spatialReviewRegistry, streamingBridgeOptions);
  return detachCapture;
}

function words(value) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const textureSlots = [
  'map', 'normalMap', 'bumpMap', 'roughnessMap', 'metalnessMap',
  'aoMap', 'emissiveMap', 'alphaMap',
];

function annotateTexture(texture, name, sourceRef) {
  if (!texture?.isTexture) return;
  if (!texture.name) texture.name = name;
  texture.userData ||= {};
  if (!texture.userData.sourceRef) texture.userData.sourceRef = sourceRef;
}

function annotateGeneratedTextures(textures) {
  const definitions = {
    dirt: ['Wash dirt', 'src/textures.js#makeDirt'],
    sand: ['Wash sand', 'src/textures.js#makeSand'],
    rock: ['Sedona sandstone', 'src/textures.js#makeRock'],
    grit: ['Footprint-locked grit', 'src/textures.js#makeGrit'],
    clast: ['Wash clast surface', 'src/textures.js#makeClastSurface'],
    macro: ['Terrain macro variation', 'src/textures.js#makeMacro'],
    variance: ['Stratigraphic variance', 'src/textures.js#makeVariance'],
    crack: ['Dried wash cracks', 'src/textures.js#makeCracks'],
  };

  for (const [key, [label, sourceRef]] of Object.entries(definitions)) {
    const value = textures[key];
    if (value?.isTexture) {
      annotateTexture(value, label, sourceRef);
      continue;
    }
    for (const [slot, texture] of Object.entries(value || {})) {
      annotateTexture(texture, `${label} ${words(slot)}`, sourceRef);
    }
  }
}

function annotateRoots(roots, materialLabel, sourceRef, componentMaterialNames) {
  const materials = new Set();
  const geometries = new Set();
  for (const root of roots) {
    root.traverse((object) => {
      if (object.geometry && !geometries.has(object.geometry)) {
        geometries.add(object.geometry);
        if (!object.geometry.name) {
          object.geometry.name = `${words(object.name || materialLabel)} geometry`;
        }
      }

      const candidates = Array.isArray(object.material)
        ? object.material
        : object.material ? [object.material] : [];
      for (const material of candidates) {
        if (!materials.has(material)) {
          materials.add(material);
          if (!material.name) {
            material.name = componentMaterialNames && object.name
              ? `${materialLabel} / ${words(object.name)}`
              : materialLabel;
          }
        }
        for (const slot of textureSlots) {
          annotateTexture(
            material[slot],
            `${material.name} ${words(slot)}`,
            sourceRef,
          );
        }
      }
    });
  }
}

function stageReviewAppearance(roots, appearance) {
  for (const root of roots) {
    root.traverse((object) => {
      const candidates = Array.isArray(object.material)
        ? object.material
        : object.material ? [object.material] : [];
      for (const material of candidates) {
        const value = typeof appearance === 'function'
          ? appearance(object, material)
          : appearance;
        if (value && !reviewMaterialAppearances.has(material)) {
          reviewMaterialAppearances.set(material, value);
        }
      }
    });
  }
}

function heroAppearance(object) {
  if (object.name === 'juniper-wood') return { color: reviewColors.wood };
  if (object.name === 'juniper-foliage') return { color: reviewColors.foliage };
  if (object.name === 'juniper-hummock') return { color: reviewColors.hummock };
  if (object.name === 'juniper-litter') return { color: reviewColors.litter };
  return null;
}

function vegetationAppearance(object) {
  if (object.name.startsWith('veg-grass')) return { color: reviewColors.grass };
  if (object.name.startsWith('veg-shrub')) return { color: reviewColors.scrub };
  if (object.name.startsWith('veg-pear') || object.name.startsWith('veg-agave')) {
    return { color: reviewColors.succulent };
  }
  if (object.name.startsWith('veg-mid')) return { color: reviewColors.midJuniper };
  if (object.name.startsWith('veg-far')) return { color: reviewColors.farJuniper };
  return null;
}

function registerActor({
  actorId, assetId = actorId, name, category, sourceRef, roots, tags, order,
  materialLabel = `${name} surface`, componentMaterialNames = false,
  reviewAppearance,
}) {
  annotateRoots(roots, materialLabel, sourceRef, componentMaterialNames);
  if (reviewAppearance) stageReviewAppearance(roots, reviewAppearance);
  spatialReviewRegistry.register({
    actorId, assetId, name, category, sourceRef, roots, tags, order,
  });
}

const canyonParts = {
  wallR: ['canyon-wall-right', 'Right canyon wall'],
  apronR: ['canyon-apron-right', 'Right canyon apron'],
  wallL: ['canyon-wall-left', 'Left canyon wall'],
  apronL: ['canyon-apron-left', 'Left canyon apron'],
};

/**
 * Register the authoritative procedural roots after every reviewable factory
 * has finished. Distributed instance fields stay grouped because their source
 * factories, rather than individual GPU instances, are the editable boundary.
 */
export function registerSpatialReviewScene({
  textures, terrainMesh, canyon, buttes, talus, farRidges, clasts, juniper,
  vegetation,
}) {
  annotateGeneratedTextures(textures);

  registerActor({
    actorId: 'sedona-wash-terrain',
    name: 'Sedona wash terrain',
    category: 'Landscape',
    sourceRef: 'src/terrain.js#buildTerrainMesh',
    roots: [terrainMesh],
    tags: ['wash', 'ground', 'procedural'],
    order: 10,
    materialLabel: 'Procedural wash terrain',
    reviewAppearance: { color: reviewColors.terrain },
  });

  for (const root of canyon) {
    const definition = canyonParts[root.name];
    if (!definition) throw new Error(`Unknown canyon review root: ${root.name}`);
    registerActor({
      actorId: definition[0],
      name: definition[1],
      category: 'Canyon geology',
      sourceRef: `src/rock.js#buildWalls:${root.name}`,
      roots: [root],
      tags: ['canyon', root.name.startsWith('wall') ? 'wall' : 'apron'],
      order: 20 + canyon.indexOf(root),
      materialLabel: 'Sedona sandstone',
      reviewAppearance: { color: reviewColors.sandstone },
    });
  }

  buttes.forEach((root, index) => registerActor({
    actorId: `distant-butte-${index + 1}`,
    name: `Distant butte ${index + 1}`,
    category: 'Canyon geology',
    sourceRef: `src/rock.js#BUTTES[${index}]`,
    roots: [root],
    tags: ['butte', 'distance', 'silhouette'],
    order: 30 + index,
    materialLabel: 'Sedona sandstone',
    reviewAppearance: { color: reviewColors.sandstone },
  }));

  registerActor({
    actorId: 'canyon-talus-field',
    name: 'Canyon talus field',
    category: 'Canyon geology',
    sourceRef: 'src/rock.js#buildTalus',
    roots: talus,
    tags: ['talus', 'instanced', 'procedural'],
    order: 50,
    materialLabel: 'Sedona sandstone talus',
    reviewAppearance: { color: reviewColors.sandstone },
  });

  registerActor({
    actorId: 'far-ridgelines',
    name: 'Far ridgelines',
    category: 'Landscape',
    sourceRef: 'src/farridge.js#buildFarRidges',
    roots: [farRidges],
    tags: ['distance', 'silhouette', 'context'],
    order: 60,
    materialLabel: 'Distant sandstone silhouette',
    reviewAppearance: { color: reviewColors.farRidge },
  });

  registerActor({
    actorId: 'wash-stone-scatter',
    name: 'Wash stone scatter',
    category: 'Ground detail',
    sourceRef: 'src/scatter.js#buildScatter',
    roots: clasts,
    tags: ['gravel', 'clasts', 'instanced', 'procedural'],
    order: 70,
    materialLabel: 'Procedural wash clasts',
    reviewAppearance: { color: reviewColors.clast },
  });

  registerActor({
    actorId: 'hero-juniper',
    name: 'Hero juniper',
    category: 'Vegetation',
    sourceRef: 'src/juniper.js#buildJuniper',
    roots: juniper,
    tags: ['juniper', 'landmark', 'multi-root'],
    order: 80,
    materialLabel: 'Hero juniper material',
    componentMaterialNames: true,
    reviewAppearance: heroAppearance,
  });

  registerActor({
    actorId: 'sparse-vegetation',
    name: 'Sparse wash vegetation',
    category: 'Vegetation',
    sourceRef: 'src/vegetation.js#buildVegetation',
    roots: vegetation,
    tags: ['vegetation', 'instanced', 'procedural'],
    order: 90,
    materialLabel: 'Sparse wash vegetation',
    componentMaterialNames: true,
    reviewAppearance: vegetationAppearance,
  });

  return spatialReviewRegistry;
}

/**
 * The editor serializes standard material fields, not this site's custom shader
 * pipeline. Apply representative base colors only after the capture page has
 * drawn its deterministic first frame. Capture pages do not start the game
 * loop, so the website image stays unchanged while subsequent editor requests
 * receive recognizable terrain, sandstone, vegetation, and wood materials.
 */
export function prepareSpatialReviewCapture() {
  if (!isSpatialReviewCapture()) return false;
  for (const [material, appearance] of reviewMaterialAppearances) {
    if (appearance.color !== undefined && material.color?.isColor) {
      material.color.setHex(appearance.color);
    }
    if (appearance.roughness !== undefined && 'roughness' in material) {
      material.roughness = appearance.roughness;
    }
    if (appearance.metalness !== undefined && 'metalness' in material) {
      material.metalness = appearance.metalness;
    }
    material.needsUpdate = true;
  }
  return true;
}

export function stopSpatialReview() {
  detachCapture?.();
  detachDiscovery?.();
  detachCapture = null;
  detachDiscovery = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', stopSpatialReview, { once: true });
  import.meta.hot?.dispose(stopSpatialReview);
}
