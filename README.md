# Dynamic Code Reveal Over User Video

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Create a striking **dynamic code reveal** animation that blends scrolling pseudo‑code with the luminance of any video you provide.

![Demo GIF](docs/demo.gif)

## Table of Contents

* [Features](#features)
* [Live Demo](#live-demo)
* [Getting Started](#getting-started)
* [Usage](#usage)
* [How It Works](#how-it-works)
* [Roadmap](#roadmap)
* [Screenshots](#screenshots)
* [License](#license)

## Features

* **Dynamic Text Reveal** – Code characters fade in/out based on the luminance of the underlying video.
* **User Video Import** – Upload any local video as the background & luminance source.
* **Blurred Video Background** – Edge‑clamped Gaussian blur keeps borders crisp.
* **Sophisticated GUI**

  * Video upload dialog
  * Luminance threshold & inversion
  * Softness (hard / feathered) control
  * Font family & size selection
  * Blur amount slider
  * Playback controls (⏪ ▶️ ⏩)
  * Debug mask overlay
  * Light / dark theme toggle
* **Responsive Design** – Works seamlessly on desktop, tablet & mobile.
* **High Performance** – Real‑time processing with HTML5 Canvas & modern JavaScript.

## Live Demo

> **Try it now:** [*Dynamic Code Reveal on GitHub Pages*](https://your‑username.github.io/dynamic‑code‑reveal/)
> *(or clone the repo and open `index.html` locally)*

## Getting Started

### Prerequisites

No build tools required – everything runs in the browser.

### Installation

```bash
git clone https://github.com/your‑username/dynamic‑code‑reveal.git
cd dynamic‑code‑reveal
open index.html   # or just serve the folder with your favourite dev server
```

### Folder Structure

```
dynamic‑code‑reveal/
├── src/
│   ├── app.js
│   └── styles.css
├── assets/
│   └── icons/
├── docs/
│   └── demo.gif
└── index.html
```

## Usage

1. Click **Upload Video** and choose any short MP4/WEBM file.
2. Tweak the **Luminance Threshold** to decide where the code becomes visible.
3. (Optional) Flip **Invert Mask** to reveal code in dark areas instead of light.
4. Adjust **Blur**, **Softness**, and **Font** to taste.
5. Share a screen recording of the result – it looks great on social media! 🎥✨

## How It Works

Each video frame is drawn to an off‑screen canvas where per‑pixel luminance is sampled.
The luminance array drives the alpha channel of an overlay of generated pseudo‑code on the main canvas, revealing characters only where the threshold is met.
Separately, the background video undergoes a padded, edge‑clamped Gaussian blur so that even heavy blur never shows transparent edges.

Built with **HTML5 Canvas**, **CSS Custom Properties**, **Flexbox**, and **ES6+** JavaScript. No external dependencies.

## Roadmap

* [ ] Custom code input & presets
* [ ] Code “flicker” animation option
* [ ] Support for looping GIF backgrounds
* [ ] Export to MP4/GIF
  *Pull requests are welcome!*

## Screenshots

| Light Theme                         | Dark Theme                        |
| ----------------------------------- | --------------------------------- |
| ![Light](docs/screenshot‑light.png) | ![Dark](docs/screenshot‑dark.png) |

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
