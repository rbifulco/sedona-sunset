# Spatial Review integration review — 2026-09-26

The active integration is `spatial-review/fresh-install` in this checkout. Its
`package.json` and lockfile pin the latest published
`@alterno-dev/spatial-review` and protocol release, 0.7.0. The dedicated capture
still exports 20 source-derived actors, 20 assets, one World owner, and ten exact
keyboard jump viewpoints. It exports no invented transitions. The ordinary
`index.html` and `src/` modules are unchanged by this review.

## Change

The old descriptors reported both Scene overview and Asset detail as carrying
position, normal and UV data, with the same 146.48 MB total estimated workload.
SDK 0.7.0 actually sends positions and indices in Scene and adds normals, UVs,
and map references in Asset. The capture now advertises those profile-specific
attributes and counts instanced placements. It estimates each capture-cloned
renderable, including typed instance matrices, with headroom for transfer
metadata. The complete topology and actual transmitted geometry are unchanged.

The new total advertised Scene workload is 46.04 MB and Asset detail is
75.58 MB. Terrain's Scene overview fell from a 65.89 MB estimate to 21.83 MB;
its actual SDK transfer measured 17.42 MB. Hero juniper detail measured
1.57 MB against a 2.00 MB estimate. More accurate estimates improve the
editor's workload display and avoid rejecting a valid lower-budget overview
solely because of detail-only attributes. They do not speed up source geometry
construction or the actual transfer.

## Checks

- `npm run test:review`: four tests pass, including an SDK transfer comparison
  with shared source geometry cloned per renderable and 1,000 instances.
- `npm run build`: capture bundle rebuilt successfully from the pinned package.
- `node tools/gate.mjs --preflight --allow-dirty`: source parsing, module
  evaluation, shader checks, scene construction and walking confinement pass.
  This is preflight, not the original full visual gate.
- Direct Chromium capture from the ordinary site's local server reached 20
  actors, 20 assets and ten stops in 18 seconds, with no page errors. The
  measured terrain Scene and hero Asset transfers fit their advertised budgets.
- The current local editor connected to the updated capture through the
  ordinary URL. At 53 seconds its Scene route reported that the workspace was
  ready and that live details could continue loading, while the viewport
  preparation overlay still read 31% (“Capturing the prepared scene”); there
  were no page errors. An isolated hero Asset editor check hit a 105-second
  harness limit before a settled state could be read. Current-editor settled
  Scene, Asset and Experience views remain unverified for this change. The
  September 4 hosted acceptance in `spatial-review-evidence.md` applies to the
  previous published bundle.

## Review limits

This is a geometry, composition and source-location representation. The SDK
does not transfer Sedona's custom rock and terrain shader logic, bark vertex
colors, vegetation instance colors, wind, atmosphere, sky, post-processing or
the source alpha-test shadow behavior. Capture shading, terrain UV projection
and alpha maps are declared approximations; use the ordinary website for final
appearance decisions. No published deployment was changed by this review.
