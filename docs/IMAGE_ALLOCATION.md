# Image Allocation

All sizes below are exact byte counts. Original files remain in `images/`; the website uses optimized WebP derivatives under `public/assets/`.

| Website use | Canonical project source | Source pixels | Source bytes | Production file | Production pixels | Production bytes |
|---|---|---:|---:|---|---:|---:|
| Hero | `images/Main hero couple photo.jpg` | 1600×2000 | 1,013,576 | `public/assets/images/hero/hero-1600.webp` | 1600×2000 | 128,166 |
| Final couple | `images/Final couple portrait.jpg` | 1600×2000 | 944,479 | `public/assets/images/final/final-1600.webp` | 1600×2000 | 96,950 |
| Venue | `images/Planet Auditorium photo.jpg` | 1920×1080 | 1,581,249 | `public/assets/images/venue/venue-1920.webp` | 1920×1080 | 298,644 |
| Desktop Frame 01 | `images/DESCTOP/01.png` | 1920×1080 | 2,084,109 | `public/assets/story/story_frame_01.webp` | 1920×1080 | 90,740 |
| Desktop Frame 02 | `images/DESCTOP/02.png` | 1920×1080 | 2,541,972 | `public/assets/story/story_frame_02.webp` | 1920×1080 | 151,680 |
| Desktop Frame 03 | `images/DESCTOP/03.png` | 1920×1080 | 2,663,486 | `public/assets/story/story_frame_03.webp` | 1920×1080 | 160,844 |
| Desktop Frame 04 | `images/DESCTOP/04.png` | 1920×1080 | 2,474,977 | `public/assets/story/story_frame_04.webp` | 1920×1080 | 138,318 |
| Desktop Frame 05 | `images/DESCTOP/05.png` | 1920×1080 | 2,452,021 | `public/assets/story/story_frame_05.webp` | 1920×1080 | 137,366 |
| Desktop Frame 06 | `images/DESCTOP/06.png` | 1920×1080 | 2,499,585 | `public/assets/story/story_frame_06.webp` | 1920×1080 | 144,906 |
| Mobile Frame 01 | `images/MOBILE/01.png` | 1080×1920 | 2,084,023 | `public/assets/story/story_frame_01_mobile.webp` | 1080×1920 | 93,898 |
| Mobile Frame 02 | `images/MOBILE/02.png` | 1080×1920 | 2,484,379 | `public/assets/story/story_frame_02_mobile.webp` | 1080×1920 | 156,018 |
| Mobile Frame 03 | `images/MOBILE/03.png` | 1080×1920 | 2,494,742 | `public/assets/story/story_frame_03_mobile.webp` | 1080×1920 | 158,268 |
| Mobile Frame 04 | `images/MOBILE/04.png` | 1080×1920 | 2,418,920 | `public/assets/story/story_frame_04_mobile.webp` | 1080×1920 | 140,268 |
| Mobile Frame 05 | `images/MOBILE/05.png` | 1080×1920 | 2,396,183 | `public/assets/story/story_frame_05_mobile.webp` | 1080×1920 | 142,452 |
| Mobile Frame 06 | `images/MOBILE/06.png` | 1080×1920 | 2,412,803 | `public/assets/story/story_frame_06_mobile.webp` | 1080×1920 | 145,214 |

Responsive hero derivatives are 640×800 (44,938 bytes), 960×1200 (73,210 bytes), 1280×1600 (101,492 bytes), and 1600×2000 (128,166 bytes).

Responsive final-couple derivatives are 640×800 (32,842 bytes), 960×1200 (53,492 bytes), 1280×1600 (75,120 bytes), and 1600×2000 (96,950 bytes).

Responsive venue derivatives are 720×405 (71,272 bytes), 1200×675 (161,600 bytes), and 1920×1080 (298,644 bytes).

To replace a story frame later, export a WebP at the same dimensions and overwrite only the matching production filename. Keep the desktop and mobile subject placement consistent.
