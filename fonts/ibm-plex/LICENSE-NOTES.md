# IBM Plex self-host notes

These woff2 files are IBM Plex Sans and IBM Plex Mono, redistributed under the
SIL Open Font License 1.1 (see `OFL.txt` in this directory). Reserved Font Name
"Plex" remains with IBM Corp.

## Self-host only

Load fonts from this directory via `fonts.css` (relative `url(...)` only). Do
not request font files from an external network host at page load. Clients that
import `fonts.css` satisfy the organization design rule of self-hosted fonts
from `assets`.

## Files

| File | Family | Weight |
|---|---|---|
| `IBMPlexSans-Regular.woff2` | IBM Plex Sans | 400 |
| `IBMPlexSans-Medium.woff2` | IBM Plex Sans | 500 |
| `IBMPlexSans-SemiBold.woff2` | IBM Plex Sans | 600 |
| `IBMPlexMono-Regular.woff2` | IBM Plex Mono | 400 |

Repository content outside this directory stays under CC BY-SA 4.0. These font
binaries stay under OFL-1.1 and must not be sold by themselves.
