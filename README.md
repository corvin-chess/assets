<div align="center">

<a href="https://github.com/corvin-chess"><img src="https://capsule-render.vercel.app/api?type=waving&height=200&color=0:0b0d12,55:161b2b,100:2f3d63&text=Corvin&fontColor=e6e9f2&fontSize=64&fontAlignY=45&animation=twinkling" alt="Corvin" width="100%" /></a>

<img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=500&size=16&color=8FA3D9&center=true&vCenter=true&width=560&height=34&duration=2800&pause=1200&lines=assets;Corvid,+Ravenboard,+sounds,+brand,+fonts;Offer+SFX+included." alt="assets" />

<p>
  <a href="https://github.com/corvin-chess/assets"><img src="https://skillicons.dev/icons?i=github&theme=dark" width="44" height="44" alt="assets" /></a>&nbsp;
  <a href="https://github.com/corvin-chess"><img src="https://skillicons.dev/icons?i=github&theme=dark" width="44" height="44" alt="GitHub" /></a>
</p>

</div>

<br/>

Corvid piece SVGs, Ravenboard colors, original play sounds, brand mark, and self-hosted IBM Plex font files for Corvin clients.

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:0b0d12,35:8fa3d9,70:c9a227,100:0b0d12" width="100%" alt="" />

<br/>

<p align="center"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=18&color=8FA3D9&center=true&vCenter=true&width=420&height=40&duration=1&pause=1000000&letterSpacing=6px&lines=OVERVIEW" alt="Overview" /></p>

Repository for Corvin-original visual and audio assets consumed by [design-system](https://github.com/corvin-chess/design-system), [web](https://github.com/corvin-chess/web), and other clients. Corvid piece SVGs (45x45 viewBox, editable sources under `pieces/corvid/src/`), Ravenboard color tokens (`boards/ravenboard/`), play SFX under `sounds/` (`move`, `capture`, `check`, `game-end`, `offer` WAV plus mute-safe license notes), brand mark under `brand/mark.svg`, and self-hosted IBM Plex Sans/Mono woff2 under `fonts/ibm-plex/` (local `@font-face` only; OFL-1.1) are present. Everything chess-specific stays Corvin-original; no third-party piece sets, boards, or sounds.

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:0b0d12,35:8fa3d9,70:c9a227,100:0b0d12" width="100%" alt="" />

<br/>

<p align="center"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=18&color=8FA3D9&center=true&vCenter=true&width=420&height=40&duration=1&pause=1000000&letterSpacing=6px&lines=GETTING+STARTED" alt="Getting Started" /></p>

```bash
git clone https://github.com/corvin-chess/assets
cd assets
```

Piece exports: `pieces/corvid/w-king.svg` … `pieces/corvid/b-pawn.svg` (twelve files; matching sources in `pieces/corvid/src/`). Manifest: `pieces/corvid/manifest.json`. Board palette: `boards/ravenboard/colors.json` and `boards/ravenboard/ravenboard.css`. Play sounds: `sounds/move.wav`, `sounds/capture.wav`, `sounds/check.wav`, `sounds/game-end.wav`, `sounds/offer.wav` with `sounds/manifest.json` and `sounds/LICENSE-NOTES.md`. Brand: `brand/mark.svg` with `brand/manifest.json` and `brand/LICENSE-NOTES.md`. Fonts: `fonts/ibm-plex/fonts.css` plus the listed woff2 files (see `fonts/ibm-plex/LICENSE-NOTES.md` and `OFL.txt`).

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:0b0d12,35:8fa3d9,70:c9a227,100:0b0d12" width="100%" alt="" />

<br/>

<p align="center"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=18&color=8FA3D9&center=true&vCenter=true&width=420&height=40&duration=1&pause=1000000&letterSpacing=6px&lines=DEVELOPMENT" alt="Development" /></p>

Edit Corvid silhouettes in `pieces/corvid/src/`, then copy to the export paths (or run `node scripts/build-corvid.mjs` to regenerate both). Ravenboard tokens live in `boards/ravenboard/`. Regenerate play WAV files with `node scripts/synthesize-sounds.mjs` (deterministic PCM; keep `sounds/LICENSE-NOTES.md` in sync). Edit `brand/mark.svg` against the organization design document (continuous stroke, gold square eye). Keep `fonts/ibm-plex/fonts.css` on relative local urls only. Keep fills, outlines, and board hexes aligned with the organization design document.

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:0b0d12,35:8fa3d9,70:c9a227,100:0b0d12" width="100%" alt="" />

<br/>

<p align="center"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=18&color=8FA3D9&center=true&vCenter=true&width=420&height=40&duration=1&pause=1000000&letterSpacing=6px&lines=TESTING" alt="Testing" /></p>

```bash
node scripts/verify-readme.mjs
node scripts/verify-assets.mjs
```

`verify-assets.mjs` checks Corvid completeness (viewBox, DESIGN fills/outlines, bishop accents, src equals export), Ravenboard `colors.json` / CSS variables, play sounds (WAV PCM contract, peak/lead bounds, mute-safe license notes including `offer.wav`), brand mark geometry/colors, and IBM Plex self-host files (woff2 signature, OFL, local-only `@font-face`).

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:0b0d12,35:8fa3d9,70:c9a227,100:0b0d12" width="100%" alt="" />

<br/>

<p align="center"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=18&color=8FA3D9&center=true&vCenter=true&width=420&height=40&duration=1&pause=1000000&letterSpacing=6px&lines=ARCHITECTURE" alt="Architecture" /></p>

| Path | Role |
|---|---|
| `pieces/corvid/` | Exported Corvid SVGs + `manifest.json` |
| `pieces/corvid/src/` | Editable Corvid sources (byte-identical to exports in v1) |
| `boards/ravenboard/` | Light/dark square colors, last-move, selection, legal-move tokens |
| `sounds/` | Original play SFX (WAV), `manifest.json`, mute-safe `LICENSE-NOTES.md` |
| `brand/` | Original mark SVG, `manifest.json`, license notes |
| `fonts/ibm-plex/` | Self-hosted IBM Plex woff2, local `fonts.css`, OFL-1.1 |
| `scripts/` | README and asset verify gates; Corvid rebuild; sound synthesis |

See organization ADRs and [website](https://github.com/corvin-chess/website) once docs are published.

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:0b0d12,35:8fa3d9,70:c9a227,100:0b0d12" width="100%" alt="" />

<br/>

<p align="center"><img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&weight=700&size=18&color=8FA3D9&center=true&vCenter=true&width=420&height=40&duration=1&pause=1000000&letterSpacing=6px&lines=STATUS" alt="Status" /></p>

| Area | State |
|---|---|
| README | Built |
| LICENSE | Built |
| CI verify gate | Built |
| Corvid piece SVGs | Built |
| Ravenboard colors | Built |
| Move/capture/check/game-end sounds | Built |
| Brand mark + IBM Plex self-host | Built |
| Offer SFX | Built |
| Implementation | Planned |

<img src="https://capsule-render.vercel.app/api?type=rect&height=3&color=0:0b0d12,35:8fa3d9,70:c9a227,100:0b0d12" width="100%" alt="" />

<br/>

<p align="center"><sub><i>Original pieces, boards, and sounds so every Corvin client shares one honest face.</i></sub></p>

## License

This repository is licensed under CC BY-SA 4.0. IBM Plex font files under `fonts/ibm-plex/` are redistributed under the SIL Open Font License 1.1 (`fonts/ibm-plex/OFL.txt`). See `NOTICE` for the license carve-out.

<img src="https://capsule-render.vercel.app/api?type=waving&section=footer&height=110&color=0:0b0d12,55:161b2b,100:2f3d63" alt="" width="100%" />
