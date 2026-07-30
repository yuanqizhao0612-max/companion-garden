# 《陪伴花园》V0.5 修复与花园成长 QA

## 对比基准

- Source visual truth:
  - `/Users/zhaokaixin/Downloads/花园风格分阶段设计图.png`
  - `/Users/zhaokaixin/Desktop/陪伴花园/微信图片_20260729212225_487_219.jpg`
  - `/var/folders/94/qszq6c4d62g45gpvd9sc6x880000gn/T/codex-clipboard-1b9fcd4f-6503-44ee-b5c5-456d765c7332.png`
- Browser-rendered implementation screenshots:
  - `artifacts/v05/game-mobile.png`
  - `artifacts/v05/garden-empty-mobile-top.png`
  - `artifacts/v05/garden-grown-mobile-top.png`
- Combined comparison evidence:
  - `artifacts/v05/comparison-empty-garden.png`
  - `artifacts/v05/comparison-grown-garden.png`

## Capture normalization

- Browser: Codex in-app browser.
- Browser viewport: 1280 × 720 CSS px, device scale factor 1.
- Product shell: centered 520 CSS px mobile canvas.
- Implementation screenshots: 520 × 1059 full game page; 520 × 720 garden first-screen captures.
- Comparison panels: two equal 520 × 720 panels separated by a 16 px neutral gutter.
- The source and implementation panels were resized with proportional cover crops; neither panel was stretched.

## Findings and fixes

1. Pale-blue flower frames — resolved.
   - Cause: the old covered-tile obstacle used a pale-blue `::after` frame without explaining the mechanic.
   - Fix: removed the cover mechanic, level cover data, and frame styling.
   - Browser audit: 36 tiles rendered; `.tile.covered` count 0; tile pseudo-frame count 0.
2. Four-in-a-row visually clearing only three flowers — resolved.
   - Cause: the reward-special anchor was removed from the clear set before the removal animation.
   - Fix: every matched tile now completes the remove/collapse phase; the special reward is placed afterward at the anchor.
   - Regression evidence: the four matched tile IDs all change before the special tile is created.
3. Garden starting with flowers — resolved.
   - Fresh state now contains 0 flower clusters.
   - Each successful level adds exactly one cluster.
   - Legacy welcome flowers are filtered during state normalization.
4. Preview-stage label mismatch — resolved.
   - Stage 1 now shows `成长第 1 阶段`, 0 flower overlays, and `完成第一关，这里会长出第一簇花`.
   - Stage 5 shows `成长第 5 阶段`, 18 preview overlays, and matching progress copy.

## Visual fidelity

- Empty-garden comparison preserves the supplied miniature 3D cottage, soft green hills, rounded trees, peach roof, blue sky, and a generous flower-free lawn.
- Growth comparison extends the supplied tulip style into coral, yellow, cream, rose, and lavender clusters with matching soft 3D material and lighting.
- Added clusters occupy the lawn without covering the cottage entrance or stage badge.
- The game board retains large, shape-distinct flower pieces and no unexplained pale-blue overlays.

## Interaction and runtime checks

- Tested homepage → game → return → garden.
- Tested development level selector and stage 1 / stage 5 garden previews.
- Tested empty garden count (0) and grown preview count (18).
- Tested no covered-tile DOM classes or pseudo-frame styling.
- Browser console errors/warnings: none observed.
- Automated regression suite: 32 tests passed.
- Production build: passed.

## Comparison history

1. First implementation pass correctly showed 0 flowers in stage 1, but its badge still reflected the old saved stage 5.
2. The badge and progress note were made preview-aware.
3. The final browser capture shows stage 1 with an empty lawn and stage 5 with matching flower quantity and copy.

final result: passed
