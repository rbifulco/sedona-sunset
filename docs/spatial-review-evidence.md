# Fresh integration evidence

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

## Pending before final acceptance

Publication and direct production discovery/capture/official editor verification. Protocol success is not substituted for editor UI success. Publication rollback source: feat/alterno-spatial-review at 3cd953428ac645edf000338e8d9b155b8d26b8a8.

The original full visual gate was not rerun: unchanged ordinary source, exact before/after image and interaction parity, and passing original preflight resolve this integration’s regression risk. No full-gate pass is claimed.

Actual local Scene editor loaded all20/20 actors. Ownership tree lists the World owner and independent hero-juniper placement. A disposable whole-object observation exported `schema: spatial-feedback/v1`, `kind: agent-change-set`, target actorId/assetId hero-juniper, sourceRef src/juniper.js#buildJuniper. Reload and re-export are byte-identical: evidence/feedback-before-refresh.json and feedback-after-refresh.json. The test used an isolated ephemeral browser context; closing it removes disposable review state, preserving user feedback.

The first Asset snapshot was taken during preview preparation at22s despite all requested geometry reaching terminal success; it is not accepted as a usable view. The initial Experience script used the wrong source-folder route; the correct user-facing route is /path-editor, reached through visible workspace navigation in the final check. Neither test-harness issue is classified as a website regression.

Final local Asset readiness check passed in26.271s: Hero juniper,54,878 triangles,37,978 vertices,5nodes,4materials, geometry ready and8/8textures ready. It visibly contains textured wood and alpha-cut foliage; default framing is distant, and appearance limitations remain. The visible Experience link opens the correct /path-editor workspace with10 keyboard stops,0transitions and58-degree FOV. The initial screenshot was during crossfade; production smoke waits for the transition. Local editor checkout is clean at d9576b2e0cd3ee5e215e762b2ded39ad83f3c60c.

Published bundle SHA256:46a6add04253532cd6235eed4bb2666aebc0abc800a2e7b3545900d5b7a40723. Build ID:sedona-fresh-2c4e962275130371. The source and locked-dependency rebuild produces identical bundle bytes.
