# Procedural oil bottle preview

Preview: **`/preview/bottle`**. It is an independent, noindex App Router page using the existing HM NATURALS tokens and fonts. It makes no catalog/backend requests and does not replace the existing product viewer or homepage.

From `frontend/`:

```bash
npm run dev
# Open http://localhost:3000/preview/bottle
```

Reusable entry point:

```tsx
import BottleViewer from '@/components/bottle/BottleViewer';

<BottleViewer label="Chai dầu HM NATURALS chưa có nhãn" />
```

`className` and `label` are optional. Import this entry point, not `BottleCanvas`, to preserve lazy client-only loading and the error boundary. No new packages were added: Three.js, R3F, Drei, Lucide, Playwright and image tooling were already installed.

## Files created

Paths below are relative to `frontend/`; no pre-existing tracked file was modified by this task.

| File | Purpose |
| --- | --- |
| `src/components/bottle/BottleViewer.tsx` | Reusable lazy entry point, custom accessible label, error boundary and recovery. |
| `src/components/bottle/BottleCanvas.tsx` | Canvas, environment, lighting, camera, controls and WebGL lifecycle. |
| `src/components/bottle/ProceduralBottle.tsx` | Separate meshes and physically based materials. |
| `src/components/bottle/bottle-geometry.ts` | Bottle, oil and ribbed-cap geometry builders. |
| `src/components/bottle/BottleFallback.tsx` | Local rendered-still fallback and loading/error message. |
| `src/components/bottle/BottleViewer.module.css` | Scoped, responsive viewer/control styles. |
| `src/components/bottle/bottle-geometry.test.ts` | Volume, geometry and budget checks. |
| `src/components/bottle/README.md` | Reference analysis, implementation and visual handoff. |
| `src/app/preview/bottle/page.tsx` | Independent preview route with noindex metadata. |
| `src/app/preview/bottle/preview.module.css` | Preview layout using existing brand tokens. |
| `e2e/bottle-preview.spec.ts` | Browser interaction and failure/recovery tests. |
| `scripts/capture-bottle-preview.mjs` | Reproducible multi-angle screenshots and optional poster export. |
| `public/images/bottle-preview.webp` | Static render of the finished procedural model. |

## Reference inspection

All five actual files were opened and visually inspected. Their extension is **`.png`**. They are shape references only; their low oil level was deliberately not reproduced.

| Reference | Observations used |
| --- | --- |
| `references/bottle/1.png` | Tall, narrow silhouette, approximately 3.6:1 height/diameter; long rounded shoulder; cap about 44% of body diameter. |
| `references/bottle/2.png` | Oblique side confirms rounded body, shallow upper reinforcement bands and deeper curved lower ribs. |
| `references/bottle/3.png` | Underside shows a recessed centre and petaloid feet; approximated with five lobes. |
| `references/bottle/4.png` | Circular cap/body cross-section and rounded cap rim, no handle or flat rectangular sides. |
| `references/bottle/5.png` | Long shoulder-to-neck transition, neck support flange, cap/tamper-band separation, wavy lower ribs. |

Perspective and hand-held distortion prevent reliable absolute measurements. Units are relative, not millimetres or a verified commercial capacity. No photograph, label, GLB or premade bottle is used on the 3D mesh.

## Model and rendering

- `bottle-geometry.ts`: smooth swept radial geometry, four sinusoidally curved lower ribs, four shallower upper bands, continuous five-foot bottom, neck flange, rounded cap with 80 small vertical flutes. Angular seams share vertices; poles use triangle fans.
- `ProceduralBottle.tsx`: separately named PET, oil, cap and tamper-band meshes; no label. Geometry is memoized and explicitly disposed; declarative materials are owned by R3F.
- Oil is inset from the shell and filled into the shoulder, leaving the upper shoulder/neck as air. A flat meniscus has a small raised edge. Its enclosed volume is approximately 89% of the outer bottle volume; tests require 87–93%. “90%” refers to volume, not 90% of overall cap-to-foot height.
- PET uses Drei transmission with a separate 512px buffer, two samples and a thin optical depth so the oil can be seen through it. Oil uses Three's physical material, golden absorption and approximate view-dependent optical depth. IOR values are estimates, not measured properties.
- A locally generated PMREM room environment, two studio lights and a one-frame contact shadow provide reflections. No external HDR, model, image or font is requested by the viewer itself; the site's existing root font configuration remains in place.
- About 89k model triangles, DPR capped at 1.5, rendering on demand, no automatic rotation, no postprocessing. Damping stops when idle and is disabled for reduced-motion preferences.
- The camera orbits the upright bottle: the oil does not slosh or change level when the user rotates the view. Azimuth is unrestricted, elevation allows near-top and near-bottom inspection, distance is limited to 5.5–11.5 units. Zooming in intentionally allows detail cropping.

The shell-buffer choice follows [Drei's transmission documentation](https://github.com/pmndrs/drei/blob/master/docs/shaders/mesh-transmission-material.mdx), which explains why the default shared transmission sampler cannot show other transmissive objects. The oil shader adjustment targets the installed Three shader chunk; recheck rendering when upgrading Three/Drei.

## Interaction and recovery

Drag/swipe to orbit; scroll/pinch to zoom. Buttons provide keyboard-accessible left/right rotation, elevation, zoom and reset. Reset clears residual damping before restoring the saved camera. Controls have visible focus and at least 44px targets.

The SSR/loading state includes a local static render. Module/WebGL creation failures show that image and a page reload action (a rejected lazy import may be cached). Context loss or shader errors unmount the canvas and provide a fresh viewer retry. A no-JavaScript explanation is also rendered.

`public/images/bottle-preview.webp` is a browser render of this model, not one of the partially filled reference photos.

## Verification and image capture

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e -- e2e/bottle-preview.spec.ts --workers=1

# Against an already running frontend (also useful after visual edits):
BOTTLE_PREVIEW_ORIGIN=http://127.0.0.1:3000 node scripts/capture-bottle-preview.mjs --poster
```

The capture script writes front, quarter, top, base, desktop and mobile screenshots into ignored `test-results/bottle-review/`. `--poster` refreshes the shipped WebP; omit it for review-only captures. It hides the development-only Next tooling overlay when taking images.

Geometry tests validate oil volume, containment bounds, outward winding, finite unit normals and triangle limits. Browser tests exercise actual rendering, a complete turn, mouse/touch rotation, pinch, keyboard buttons, both zoom bounds, reset, missing WebGL, failed scene chunks and real context loss/retry on desktop/mobile Chromium. They do not prove performance on a physical phone.

Verified on 2026-09-30: lint, TypeScript and production build passed; all 57 frontend unit tests and all 8 preview E2E tests passed. The E2E run built and served the production bundle. A separate no-JavaScript browser check confirmed the static image loads, the explanatory text is visible and no canvas is created. Existing storefront E2E tests were not rerun as part of this isolated preview task.

## Final Refinement Pass (2026-09-30)

A comprehensive visual pass was conducted addressing bottle silhouette, materials, oil optics, and studio lighting:

1. **Bottle Geometry & Silhouette**:
   - Equalized the main body envelope to a consistent cylindrical radius (~0.520) eliminating unnatural bulges and waist pinching.
   - Refined the shoulder curve into an organic bell curve transitioning smoothly from cylinder (y = 2.58) to neck finish (y = 3.64).
   - Replaced 3-fold grip ribs with ergonomic 2-fold waves (`Math.cos(2 * theta)`) matching natural front/back finger contours without lumpy artificial bumps.
   - Replaced faceted star base with smooth 5-petaloid contact feet and central dome.
   - Redesigned cap with 72 crisp vertical knurls, realistic crown bevel, and an annular sleeve tamper ring.

2. **Oil Optics & Material**:
   - Replaced cloudy diffuse-mixed yellow with pure Beer-Lambert absorption (`color="#fffaea"`, `attenuationColor="#f59e0b"`, `attenuationDistance=0.72`).
   - Relaxed grazing angle multiplier in `oilOptics` from 2.35x down to 1.20x to eliminate dark/muddy edges.
   - Preserved ~90% enclosed oil fill level with shoulder air gap.

3. **PET Plastic Material**:
   - Upgraded Drei `MeshTransmissionMaterial` resolution to 1024 and set `samples=1` to eliminate stochastic jitter noise and milky fog.
   - Dropped roughness to 0.0 with `clearcoat=1.0` and `clearcoatRoughness=0.01` for crystal-clear PET clarity.

4. **Studio Lighting & Environment**:
   - Replaced generic `RoomEnvironment` with a dedicated offline product studio environment featuring dark negative fill, two tall vertical strip softboxes on the flanks, an overhead softbox, and a dedicated warm liquid backlight.

All 57 unit tests, typecheck, lint, production build, and all 8 Playwright E2E tests pass.

