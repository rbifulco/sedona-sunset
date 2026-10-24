# Sedona Sunset fresh Spatial Review integration

## Baseline and access

This installation starts at original clean commit `c26daa8f8faef3b46653f6cdec983a6956714ba4`, branch `spatial-review/fresh-install`, in a new isolated worktree. Previous integration worktrees and their implementations were not reused. Published npm SDK 0.9.0 (and protocol 0.9.0) is pinned in pnpm-lock.yaml; existing Three.js 0.180.0 is retained. Original native ES modules have no build command. Existing `node tools/gate.mjs --preflight` passed before dependency changes.

Existing production approval in `sedona-sunset-sdk-0.7-publish/SPATIAL_REVIEW.md` records explicit approval on 2026-08-30 for `https://spatial-review.alterno.dev`, framing, and deliberately registered scene, geometry, materials, textures, and source references. This unchanged scope is reused. No other production editor origin is authorized; policy advertisement stays disabled. Loopback peers are explicitly enabled for development. GitHub Pages has no existing restrictive framing headers and supports no per-route custom headers here. No unrelated data, storage, DOM, cookies, or application state are registered.

Production publication is separately authorized by the current user request. Existing destination is `https://rbifulco.github.io/sedona-sunset/`, served by the Pages branch `spatial-review/fresh-install` at its root. Commit the regenerated capture bundle there; the existing Pages build-and-deployment workflow publishes the branch without rewriting history.

## Scope and source ownership

Ordinary `index.html` and every `src/*.js` remain byte-identical to the original. A static project-relative `.well-known/spatial-review.json` discovers `review/capture.html`; the ordinary visitor loads no review imports, listeners, timers, workers, textures, or geometry. `review/capture.js` alone reconstructs seeded actual source factories. No simplified geometry proxies are used. Build extracts keyboard SPOTS from authoritative `src/main.js` rather than duplicating authored data manually.

| Actor / asset | Authoritative definition | Representation |
| --- | --- | --- |
| Wash terrain | src/terrain.js#buildTerrainMesh and applyScour | Full terrain geometry after scatter scour |
| Four wall/apron actors | src/rock.js#buildWalls | Independent actual meshes |
| Ten butte actors | src/rock.js#BUTTES and buildDistantButtes | Independent authored formations |
| Talus field | src/rock.js#buildTalus | Actual instanced variant geometry and matrices |
| Far ridges | src/farridge.js#buildFarRidges | Full child hierarchy |
| Stone field | src/scatter.js#buildScatter | Actual distribution, variants and instances |
| Hero juniper | src/juniper.js#buildJuniper | Wood, foliage, hummock and litter components |
| Vegetation field | src/vegetation.js#buildVegetation | Actual seeded instanced distribution |
| Keyboard viewpoints | src/main.js#SPOTS, placeAt, syncCamera | Ten exact instant-jump stops, 58-degree FOV |

One transform-only `sedona-world` assembly owns the 20 actors. Each root occurs once. Fields are authored distribution decisions, not individual plant placement controls; individual-instance placement editing is outside scope. World units are metres, Y up, forward broadly -Z. Actor transforms use the exact first source-root world transform under an identity world owner, matching the SDK canonical asset frame. Feedback world positions convert directly to source world coordinates; canonical bounds center is not a source pivot. Component-local edits transform through the first root world matrix; apply its inverse for the return conversion. Owned operations are applied once at their owner. Stable IDs derive from source role and source mesh names, never UUIDs. This new review baseline intentionally uses fresh semantic IDs: retain old review sets separately and migrate unmatched feedback manually.

## Materials and textures

All renderables were checked for custom uniforms, shader injection, procedural projection, essential custom attributes, UVs, and generated sources. SDK 0.9.0 preserves source RGB/RGBA vertex attributes, UVs, and supported texture maps in both Scene and Asset; supplied normals are Asset detail only. Capture materials preserve the source `vertexColors` flag. Source juniper, far-ridge, vegetation, and stone materials intentionally enable baked visible color/AO; other custom shader attributes remain unsupported rather than being displayed as RGB. Capture-only alphaMap textures threshold original albedo alpha into the supported green channel. This approximates alphaTest with blending; filtering, normalScale, instance tint, and custom shader injection remain unfaithful. Bark and foliage maps are generated credential-free sources and use live texture transport.

Custom rock and terrain albedo uniforms retain the existing dominant-axis UV approximation with original generated textures. World-projected geometry is cloned only when its pose/projection rule differs; other source geometry and all source textures remain shared. The established per-renderable material descriptors remain distinct to preserve material feedback IDs and mesh-derived names. Tests compare component IDs, material IDs, and node-to-material references against the former per-renderable capture layout. Geometry resource IDs may become canonical references when sharing is retained; they are not feedback target IDs. Every actor, asset, component, material target and source mapping remains stable.

The projection does not reproduce shader blending, warped strata, erosion, microdetail, wind, view-dependent effects, atmosphere, illumination or post-processing. These representations remain **unsuitable for final appearance decisions**; they support geometry, component and placement inspection. Sky, lights, particles, audio and post-processing are intentionally excluded and remain visible only on the ordinary website.

Source texture strings are procedural/decoded sources; none needs credentials or signed URLs. No synthetic proxy claims render fidelity. Representative texture check: hero-juniper foliage live resource and decoded image; bark and foliage are required evidence, not optional decoration.

## Navigation

SPOTS performs instant keyboard teleports. Free WASD movement is user-directed, constrained by WashPath and corridor, not an authored timed camera rail. Export ten source-derived stops and no invented interpolated segment. Stop positions use the exact path.posAt and terrain.heightAtQ plus 1.65m eye height; aim uses the exact YXZ yaw/pitch conversion. Experience motion and spline editing are therefore unsupported. Changes to a stop map to d/yaw/pitch in SPOTS; the inverse distance lookup is path.atZ(z).s, yaw/pitch come from target minus camera. Camera X/Y/Z are calculated from distance, the wash path and terrain; arbitrary off-path camera drags require a source-design change rather than a silent edit to distance. FOV is one shared 58-degree camera setting, so independent per-stop FOV changes also require a source-design change. The sampled 6000-point WashPath lookup is calculated terrain/input output and is not falsely exported as editable camera controls.

## Capture and transport

All initial actors, immutable representation descriptors, owner and navigation stops are registered before bridge attachment. Bootstrap progress is capture-page-only text; producer-controlled initial SDK readiness is unsupported. The first catalog request publishes readiness. Large source factories exceed the 50ms trigger; source generation is capture-only and yields between phases, with actual phase times retained. Each deferred representation clones the actual ready source hierarchy, retains shared geometry/texture resources, yields between roots, checks cancellation, and caches one prepared hierarchy per asset. Only world-projected UV geometry receives capture-owned buffer copies. SDK bounds geometry snapshots to 32 entries/64MiB and live texture ownership to its 60-second delivery grace plus 64 owners/about 256MiB. Request concurrency is one, bytes 64MiB, queue 24. Capture teardown detaches the bridge and disposes capture-owned clone geometry/materials. Browser document teardown releases source textures and factory caches. No fallback peer is promised; peers lacking asset-stream-v1 omit deferred actors.

The 0.9.0 stream descriptors count unique prepared geometry, each placement's instance matrices, and exported float attribute storage. Both profiles declare UVs and color when present; detail adds supplied normals. RGB costs 12 bytes per vertex, RGBA 16, UVs 8. Conservative estimates retain metadata headroom. Texture transfer, image decoding and GPU texture storage are separate budgets, not part of estimated geometry bytes. The build hash includes all capture modules and `pnpm-lock.yaml`; it changes on this migration, and `review/capture.bundle.js` is regenerated rather than reusing older exports.

Local ordinary URL: http://localhost:4313/ . Capture: http://localhost:4313/review/capture.html . Editor: http://localhost:4413/ . Static discovery must be requested from ordinary URL; direct capture-only tests do not prove discovery. Ordinary-page performance screen is not triggered by source inspection: no ordinary-page code changed and no review code runs there. A matching baseline/post representative visual and interaction check is retained nevertheless.

## Evidence and acceptance

Baseline: existing preflight passed. Muted Chromium Metal on Apple M3 Max, 640x360, #medium: 19.156s complete baseline probe, no page errors. `tmp/fresh-evidence/before.png` and before.json retain mid-wash view at d46 and juniper interaction d62/yaw34/pitch3. This is actual Metal evidence, not Windows D3D11 or software-rasterizer equivalence.

Completed results and explicit limitations are recorded in docs/spatial-review-evidence.md. Acceptance covered: static discovery from ordinary URL, representative Scene/Asset/Experience access, live generated foliage texture, stable feedback/source mapping, refreshed unresolved feedback, local post comparison, deployed discovery/capture/editor and explicit limits. Full original visual gate is separate from preflight; never label a preflight-only run a full gate pass.


## SDK 0.9.0 migration checks — 2026-10-24

- Existing package manager: pnpm; SDK and transitive protocol 0.9.0, Three.js 0.180.0 retained. No validator/CLI is directly declared. pnpm's generated exact-version release-age entries are committed with the lockfile.
- Baseline: four review tests and the production capture build passed before dependency changes.
- Updated: five review tests pass, including source-mask opt-in, normalized RGBA/UV serialization in both profiles, instance-budget accounting, geometry sharing, and preservation of component/material feedback identities.
- `pnpm build` regenerates the committed capture bundle. `node tools/gate.mjs --preflight --allow-dirty` passes all existing parser/module/shader/scene-build/walk checks. This is the preflight gate, not the original full GPU visual gate.
- Ordinary `index.html` and `src/` are unchanged. Review construction, generation, resources and serialization remain isolated to `review/capture.html`, so the ordinary-page integration performance screen is not triggered.
- Capture, discovery, World ownership, 20 actor/asset IDs, and the ten keyboard viewpoint stops are unchanged. No new origins or framing permissions are added.
- Real-editor visual/resource acceptance is reported separately. Unit checks do not establish texture readiness or final lighting fidelity. The previous September acceptance is historical, not proof of this build.
