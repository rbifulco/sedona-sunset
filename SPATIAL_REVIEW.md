# Spatial Review integration

Sedona Sunset exposes its authoritative procedural Three.js scene to Alterno
Spatial Review through the live browser bridge. The integration uses
`@alterno-dev/spatial-review` 0.5.0, with build ID
`sedona-sunset@1.0.0`.

## Access decision

The official editor origin `https://spatial-review.alterno.dev` was explicitly
approved on 2026-08-30. No additional production editor origin is authorized.
Both bridges therefore use:

```js
{
  allowOfficialEditor: true,
  allowedOrigins: [],
}
```

The SDK additionally permits loopback-to-loopback access for local testing.
Installing the package alone exposes nothing. The entry page starts discovery;
only `?spatial-review-capture=1` starts the live scene bridge after the scene and
its first frame are ready.

## Review structure

The integration exports 20 scene actors and 20 canonical assets:

| Review target | Count | Source owner | Boundary |
| --- | ---: | --- | --- |
| Sedona wash terrain | 1 | `src/terrain.js#buildTerrainMesh` | One generated terrain mesh |
| Canyon walls and aprons | 4 | `src/rock.js#buildWalls` | Left/right walls and aprons remain independently selectable |
| Distant buttes | 10 | `src/rock.js#BUTTES[index]` | One actor per authored formation entry |
| Canyon talus field | 1 | `src/rock.js#buildTalus` | Four instance variants remain one distributed procedural field |
| Far ridgelines | 1 | `src/farridge.js#buildFarRidges` | One contextual ridgeline system with named children |
| Wash stone scatter | 1 | `src/scatter.js#buildScatter` | Twenty-eight GPU batches remain one authored distribution |
| Hero juniper | 1 | `src/juniper.js#buildJuniper` | One multi-root asset: wood, foliage, hummock, and litter |
| Sparse vegetation | 1 | `src/vegetation.js#buildVegetation` | Instanced vegetation tiers remain one authored distribution |

Each actor currently has its own asset ID. There are no repeated placements of
one canonical design in this scene. Registration and root ordering are explicit
and deterministic in `src/spatial-review.js`.

Distributed instance fields deliberately do not expose every GPU instance as a
scene actor. Their editable source boundary is the placement/distribution
factory, and exporting tens of thousands of instance selections would make
review ambiguous. Individual instance feedback must be translated into a
factory or distribution change.

### Ownership

SDK 0.5.0 exposes `scene-assemblies-v1`, but Sedona Sunset has no authored rooms,
buildings, or loose contents that require a place owner. The export therefore
remains intentionally flat: each of the 20 actors can be selected independently,
with no inherited scene ownership. Categories are browsing metadata and do not
imply parenting.

### Paths

Path review is not applicable. The camera is controlled directly by the player
with mouse and keyboard. `WashPath` defines the terrain, corridor, and a useful
distance coordinate; it is not an authored camera, scroll, or guided-view rail.
The number-key stations are teleports and capture helpers rather than timed
journey segments. Exporting them as a `NavigationSequence` would misrepresent
the experience.

### Runtime-only systems

The sky shader, directional lights, atmospheric particles and haze,
post-processing, audio, collision corridor, player controller, and adaptive
quality governor are intentionally excluded. The review renderer cannot
reproduce the custom shader, lighting, atmosphere, audio, or post chain. Scene
and asset review should be used for structure, placement, silhouettes,
materials, generated texture evidence, and source mapping; appearance decisions
must be compared in the real website.

## Source and coordinate mapping

The scene uses metres, Three.js world axes, `Y` up, and a walk that proceeds
broadly toward negative `Z`. Actor, asset, and surface feedback use that frame.

Several large procedural meshes bake their world placement into vertex data and
retain an identity `Object3D` transform. In the flat editor, the actor frame may
therefore be bounds-centred rather than identical to the generator's source
pivot. Do not assign an exported `size` directly to `Object3D.scale`.

| Target | Apply feedback in source |
| --- | --- |
| Terrain | Change `Terrain`, the mesh grid, or material factories in `src/terrain.js`; height and placement are generated together |
| Walls/aprons | Change the path-relative wall/apron generators in `src/rock.js`; they are not independently placed Object3Ds |
| Butte `n` | Update `BUTTES[n]`: editor `X` maps to lateral placement, source `dist` maps to `-Z`, and radius/height-scale regenerate the geometry |
| Talus, stones, sparse vegetation | Change the owning distribution factory; individual instance matrices are generated output |
| Hero juniper | Placement maps to `JUNIPER_XZ`; component construction maps to the named roots in `buildJuniper()` |
| Far ridgelines | Change the placement and profile definitions used by `buildFarRidges()` |

Generated texture names and source references point back to their factory in
`src/textures.js`, `src/juniper.js`, or `src/vegetation.js`. The live bridge can
transfer their registered bytes without texture CORS.

If actor/component boundaries or butte ordering change, preserve the existing
semantic IDs or establish an explicit old-to-new mapping before refreshing a
review. Do not migrate comments by similar names alone.

## Transport and lifecycle

- Discovery: ordinary website entry URL.
- Static locator: project-relative `.well-known/spatial-review.json`; this is
  discoverable below the GitHub Pages project path rather than only at the
  `github.io` origin root.
- Live capture: `/?spatial-review-capture=1`, relative to the deployed site
  root.
- Static scene or asset JSON: not published; project-relative static discovery,
  browser discovery, and live progressive geometry are the supported transport.
- Capture readiness: all registered factories have completed, shaders have
  compiled, the deterministic first frame exists, and `window.__game` is ready.
- Capture performance: after that deterministic frame, Spatial Review keeps the
  resource bridge alive without starting the game loop. Geometry is serialized
  only when requested, with a 64 MiB per-family ceiling. An asset-stream-capable
  SDK additionally activates catalog status, cancellation, one active request,
  a 64 MiB in-flight ceiling, and a 20-request queue per source frame; SDK 0.5.0
  retains its progressive fallback.
- Refresh: reload the connected website. The procedural scene rebuilds and the
  editor requests a fresh catalog.
- Cleanup: both bridge detach functions run on `pagehide` and hot-module
  disposal.

The deployed GitHub Pages response was checked on 2026-08-30 and sends neither
`Content-Security-Policy: frame-ancestors` nor `X-Frame-Options`, so the official
editor can embed it without a framing-header change. GitHub Pages does not offer
route-scoped custom headers here. The SDK origin check remains the data-access
boundary.

## Review URLs

For local development, run `pnpm dev`, then open:

<https://spatial-review.alterno.dev/review?site=http%3A%2F%2Flocalhost%3A8099%2F>

The branch-backed production review link is:

<https://spatial-review.alterno.dev/review?site=https%3A%2F%2Frbifulco.github.io%2Fsedona-sunset%2F>

## Verification record

Verified on 2026-08-30:

- The pre-change and post-change non-rendering gates passed: JavaScript parsing,
  module evaluation, shader-source checks, procedural scene construction, and
  walking/corridor invariants.
- The capture URL rendered the unchanged website in a normal browser with body
  children `[SCRIPT, CANVAS]` and no browser warnings or errors.
- The official editor discovered the local site as `Sedona Sunset`.
- Scene review reconciled 20 objects and 20/20 progressive asset meshes.
- A representative scene actor resolved to
  `src/rock.js#buildWalls:wallR`.
- Asset review loaded the right canyon wall as 113.2K triangles, two nodes, and
  one material.
- Asset review loaded the hero juniper as 54,878 triangles, five nodes, four
  named materials, and the four named parts `juniper-wood`,
  `juniper-foliage`, `juniper-hummock`, and `juniper-litter`.
- The foliage component exposed a generated map and resolved to the
  `buildJuniper()` source reference.
- Connected-site refresh returned to exactly 20 objects and 20/20 meshes without
  duplicates.

Not fully verified:

- No disposable move/comment/export operation was authored, so the final
  feedback JSON round trip remains untested.
- The selected asset rendered with the editor's white selection treatment;
  map assignment and transfer metadata were present, but pixel-level texture
  appearance was not independently distinguished from that treatment.
- A denied non-loopback editor origin was not exercised in a browser. The
  integration has no additional production origins configured.
- The full image-comparison gate was not completed in headless Chromium on this
  Mac because its supposed GPU mode fell back to SwiftShader and exceeded the
  readiness timeout. The normal-browser frame and official-editor loop were
  verified separately.
