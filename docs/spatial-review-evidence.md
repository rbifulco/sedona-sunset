# Spatial Review 0.9.0 verification — 2026-10-24

## Published revision

- Site: https://rbifulco.github.io/sedona-sunset/
- Capture: https://rbifulco.github.io/sedona-sunset/review/capture.html
- Branch: `spatial-review/fresh-install`.
- Source commit: `3dd92f5681e645bf3c19c378dcd210ed329842c6`.
- Pages workflow: https://github.com/rbifulco/sedona-sunset/actions/runs/40123846075 — successful.
- Hosted capture identity, verified from the served bundle: `sedona-fresh-303c02a951e86bd0`.
- Installed SDK and transitive protocol: **0.9.0**. Three.js remains **0.180.0**. No CLI or validator is directly declared.

The existing pnpm manager, lockfile, publication branch and legacy branch Pages workflow are retained. The tracked capture bundle was regenerated. The content-derived build identity includes the lockfile. Approved origins, capture route, 20 actor/asset targets, one owner, and ten keyboard viewpoint stops are unchanged.

## Checks

Before upgrading, all four existing review tests and the production capture build passed. After upgrading, all five review tests pass (`pnpm test:review`); `pnpm build` regenerates the bundle. The tests cover RGB/RGBA and UV serialization in both profiles, source vertex-color opt-in, geometry/texture sharing, transfer estimates, and the former component/material feedback identities and node-to-material links.

`node tools/gate.mjs --preflight --allow-dirty` passes source parsing, module evaluation, shader source checks, scene construction and walking confinement. This is preflight only; the original full GPU visual gate was not run. Ordinary `index.html` and `src/` are unchanged, and no review work runs on the ordinary route, so the integration performance screen is not triggered. This source-level isolation is not a new visual-baseline comparison.

## Representative resource measurement

A real Chromium capture on the test host produced `hero-juniper`, mapped to `src/juniper.js#buildJuniper`, in Scene and Asset profiles. This was a **local direct-capture measurement**, not an official-editor visual acceptance result. There were no page errors. The hosted bundle has the same capture build identity.

| Resource | Scene overview | Asset detail |
| --- | ---: | ---: |
| Geometry/protocol transfer | 1,556,792 bytes | 2,012,528 bytes |
| Advertised geometry estimate | 1,985,697 bytes | 2,555,367 bytes |
| Unique vertices | 37,978 | 37,978 |
| Geometries | 4 | 4 |
| Geometries retaining RGB | 3 | 3 |
| Geometries retaining UVs | 4 | 4 |
| Materials / map slots | 4 / 8 | 4 / 8 |

The eight unique generated texture resources all transferred as PNG and decoded successfully. They total **6,212,919 bytes** of PNG payload and **13,631,488 bytes (13 MiB)** of decoded RGBA8 storage: four 512×512 images, two 1024×1024 images, and two 512×256 images. A full RGBA8 mip-chain estimate is about **17.33 MiB**; this is not measured GPU or process memory. Texture transfer, decoding, and GPU storage are separate from geometry bytes. Shared resources are counted once per unique resource.

The complete catalog advertises 59,988,823 bytes of cumulative Scene geometry work and 77,707,438 bytes of cumulative Asset detail work, not one monolithic allocation. Each request remains capped at 64 MiB. The local source-generation phases totaled 74.7 seconds on this Linux test host; this is not a production performance figure.

## Hosted editor acceptance remains blocked

The current official editor was started from the ordinary website URL. Its landing flow stopped with:

> The website did not provide its live scene catalog.

A targeted read-only attempt at the canonical Hero Juniper Asset URL,
https://spatial-review.alterno.dev/at/rbifulco.github.io/sedona-sunset/?view=asset&asset=hero-juniper,
reported that the website did not provide its asset catalog. The error appeared around 60–90 seconds. The editor discarded the capture iframe, leaving no completed frame available for a normal Retry. Zero catalog, asset, or texture responses were observed by the editor, with no page, console, or network exception recorded by the final diagnostic.

The slow capture bootstrap is consistent with the observed local generation time, but these observations do not prove the cause of the editor timeout. **Hosted Scene, Asset, and Experience visual acceptance remains unverified for this revision.** The direct capture result must not be presented as a substitute. No test feedback notes, source operations, origin changes, or unrelated editor state were created. All test browser contexts were closed.

## Appearance and identity limits

Source `vertexColors` flags are preserved; color attributes are not enabled as arbitrary RGB tints. Visible baked juniper/far-ridge/vegetation color and AO can now survive both profiles. Geometry and textures remain shared; capture-only UV projection allocates separate geometry only for distinct world-projection variants. Existing per-renderable material feedback descriptors keep their original names and identity. Canonical geometry-resource references can change without changing actor, asset, component or material feedback targets.

Custom terrain/rock projection still approximates procedural blending, warped strata and erosion. Alpha-map blending differs from source alphaTest. Custom shader injection, source normalScale, per-instance tint, wind, lighting, atmosphere and post-processing are not faithfully reproduced. Final appearance decisions still require the ordinary website.


---

## Historical September acceptance (does not verify the 0.9.0 build)

# Fresh integration evidence

The deployment and hash below describe the September 4 publication. The
September 26 local review in [spatial-review-review-2026-09-26.md](spatial-review-review-2026-09-26.md)
changes the capture bundle; those changes have not been published.

## Completed

- Original clean baseline: c26daa8f8faef3b46653f6cdec983a6956714ba4; no original SDK or build task.
- Original and post-change `node tools/gate.mjs --preflight` pass: JS parsing, source evaluation, shader preflight, scene construction, walking confinement, sun elevation. Post run uses --allow-dirty while work is pending.
- Published SDK 0.7.0 and original Three.js 0.180.0 are installed via the committed pnpm lockfile. `node tools/build-review.mjs` succeeds using pinned esbuild 0.25.9; optional dependency binary works with install scripts disabled.
- Original index.html and all src files remain unchanged. Ordinary screenshot before/after SHA1 is identically fdc307f3c66b2b7ee05e9c73e164b64b8ec2c5e7. Metal Apple M3 Max, Chromium, 640x360, #medium, mid-wash d46/yaw0/pitch0. Startup instrument: 18728ms before / 18299ms after. Juniper interaction: 1.4ms before / 1.5ms after. Camera positions and full probe outputs match exactly. No page errors in either sample. See evidence/before.json, after.json and ordinary-baseline-and-after.png.
- Dedicated capture constructs 20 source-derived actor/asset pairs, one explicit World owner and ten exact keyboard viewpoint stops. The initial bridge attaches after complete registration. No invented camera movement or simplified geometry proxies.
- Cross-origin development transport from ordinary URL's static discovery succeeds using a scoped Chromium local-network-access permission for http://127.0.0.1:4413. No browser-wide security bypass. Producer http://127.0.0.1:4313.
- Deferred hero-juniper terminal asset succeeded. Source pivot is [6.74, 1.6080784732356492, -65.65]; canonical child transforms and actor transform agree with source. Wood, foliage, hummock and litter component IDs resolve to src/juniper.js#buildJuniper and the stable source node name.
- All eight representative live texture requests succeed with image/png and decoded dimensions. Bark albedo 461452 bytes and normal 571405 bytes at 512x512; foliage albedo 318421 bytes and capture alpha 52575 bytes at 512x512; hummock maps 2222609 and 2451579 bytes at 1024x1024; litter albedo 119506 bytes and capture alpha 15372 bytes at 512x256. Details: evidence/protocol.json. Live resource IDs are intentionally ephemeral and are not feedback IDs.
- Deferred terrain cancellation: AbortError after 17.9ms from request; producer checks/yields in 8192-vertex UV chunks and between mesh clones. Navigation snapshot replacement appears, restoration succeeds. Capture bridge teardown called. Details: evidence/lifecycle.json.

## Explicit appearance limits

Source geometry, normals, UVs, instance placements and supported maps survive. SDK 0.7 does not carry custom vertex attributes/colors or normalScale. Foliage alpha thresholds are encoded into a supported capture alphaMap; transparent blending differs from the source alpha-test/shadow pipeline. Terrain/rock custom world projection is approximated using original albedo with dominant-axis UVs. Shader strata, erosion, weathering, wind, camera-dependent vertex deformation/LOD, instance/vertex color variation, view effects, original lighting, sky and post-processing are not reproduced. Final appearance fidelity is unverified and unsuitable for color/shading approval. Ordinary website remains authoritative for these decisions.

Capture factory startup contains existing monolithic source generation steps (up to about 4.3s for stone scattering), isolated from ordinary page. Those factories cannot be made sub-50ms without refactoring original construction; no claim of fully chunked bootstrap is made. Deferred conversion and transport are separately bounded. Old complete-catalog peers are not supported for deferred actors. Experience supports exact discrete stops only, no segment/spline feedback.

## Deployment and actual editor acceptance

Published to the existing [GitHub Pages website](https://rbifulco.github.io/sedona-sunset/). Pages source is now `spatial-review/fresh-install`, root directory. Initial validated deployment commit `e92099d95f7f70a4cae27984d2ac8152e43473c6` built successfully on 2026-09-04 at 06:13:43 UTC, with no build error. Existing rollback branch `feat/alterno-spatial-review` remains untouched at `3cd953428ac645edf000338e8d9b155b8d26b8a8`; reverting the Pages source to that branch restores the prior deployment without rewriting history.

Public discovery, capture HTML and capture JavaScript return HTTP 200 with correct JSON/HTML/JavaScript content types and no restrictive framing headers. The downloaded public bundle SHA256 matches the locked local rebuild: `46a6add04253532cd6235eed4bb2666aebc0abc800a2e7b3545900d5b7a40723`. Response headers are retained in evidence/production-*-headers.txt.

The actual official editor at `https://spatial-review.alterno.dev` opened from the ordinary public website URL via static discovery, with no local-network permission needed. Hero juniper reached usable Asset readiness in 25.849 seconds: 54,878 triangles, 37,978 vertices, 5 nodes, 4 materials, geometry ready and 8/8 textures ready. Its settled screenshot visibly shows generated bark and foliage maps. The visible Experience workspace link was then followed; after its busy state cleared and the transition settled, the view showed 10 stops, 0 transitions, 58-degree FOV and live spatial context. Both views had no page errors. See evidence/hosted-asset-ready.json/.png and hosted-experience-ready.json/.png. The browser context was closed after the bounded check.

The Asset framing remains distant even after Frame selection. Scene/Experience use the SDK scene profile without maps, so vegetation cards can appear opaque and terrain appears pale; these views are accepted for spatial structure and source stop inspection only. They are unsuitable for final appearance approval. No full visual-fidelity claim is made.

The original full visual gate was not rerun: unchanged ordinary source, exact before/after image and interaction parity, and passing original preflight resolve this integration’s regression risk. No full-gate pass is claimed.

Actual local Scene editor loaded all20/20 actors. Ownership tree lists the World owner and independent hero-juniper placement. A disposable whole-object observation exported `schema: spatial-feedback/v1`, `kind: agent-change-set`, target actorId/assetId hero-juniper, sourceRef src/juniper.js#buildJuniper. Reload and re-export are byte-identical: evidence/feedback-before-refresh.json and feedback-after-refresh.json. The test used an isolated ephemeral browser context; closing it removes disposable review state, preserving user feedback.

The first Asset snapshot was taken during preview preparation at22s despite all requested geometry reaching terminal success; it is not accepted as a usable view. The initial Experience script used the wrong source-folder route; the correct user-facing route is /path-editor, reached through visible workspace navigation in the final check. Neither test-harness issue is classified as a website regression.

Final local Asset readiness check passed in26.271s: Hero juniper,54,878 triangles,37,978 vertices,5nodes,4materials, geometry ready and8/8textures ready. It visibly contains textured wood and alpha-cut foliage; default framing is distant, and appearance limitations remain. The visible Experience link opens the correct /path-editor workspace with10 keyboard stops,0transitions and58-degree FOV. The initial screenshot was during crossfade; production smoke waits for the transition. Local editor checkout is clean at d9576b2e0cd3ee5e215e762b2ded39ad83f3c60c.

Published bundle SHA256:46a6add04253532cd6235eed4bb2666aebc0abc800a2e7b3545900d5b7a40723. Build ID:sedona-fresh-2c4e962275130371. At publication time, the source and locked-dependency rebuild produced identical bundle bytes.
