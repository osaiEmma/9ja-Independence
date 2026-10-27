# Nigeria Independence Day Art Competition 🇳🇬

An interactive visual presentation celebrating Nigeria's independence, people, cultures, heritage, languages, and food. Built with React, TypeScript, CSS, and the HTML Canvas API, the project tells its story through animated scenes, images, video, narration, and a particle-based Nigerian flag finale.

The experience is designed to play from beginning to end with minimal interaction: visitors watch the presentation and use the audio control to enable or mute sound.

## Experience

The presentation follows this sequence:

1. **Nigeria in Space** — A space-inspired opening with stars and planets establishes the atmosphere.
2. **Introduction** — Narration introduces the different peoples, languages, cultures, and traditions that came together to form Nigeria.
3. **Formation of Nigeria** — Sections of the Nigerian map move together to form the complete map, symbolising the coming together of different communities.
4. **Our Culture** — A video introduces the theme **“A NATION OF BEAUTIFUL CULTURE.”**
5. **Our Heritage** — A video followed by images introduces the theme **“A LAND OF GREAT HERITAGE.”**
6. **Our Tribes and Languages** — Images representing Hausa, Igbo, and Yoruba communities celebrate Nigeria's linguistic and cultural diversity.
7. **Our People** — A sequence of images celebrates Nigerian people and the diversity that shapes the nation.
8. **Our Delicacies** — A sequence of images showcases Nigerian food and culinary traditions.
9. **The Nigerian Flag** — The final scene uses a canvas particle animation to bring the presentation to a close by forming the Nigerian flag.

The middle presentation is organised into timed scenes. The current scene configuration uses these shot durations:

| Scene | Media sequence | Configured duration |
|---|---|---|
| Our Culture | One video | 5.8 seconds |
| Our Heritage | One video, then three images | 2.3 seconds for the video; 2 seconds per image |
| Our Tribes and Languages | Three images | 2.1 seconds per image |
| Our People | Five images | 2 seconds per image |
| Our Delicacies | Four images | 2.5 seconds per image |

The timers control when each shot changes; they are independent of the actual duration of a media file. Narration is triggered by scene changes rather than by every individual image or shot.

## Features

- Scene-based storytelling with automatic progression.
- Animated starfield and map-forming introduction.
- Video and image sequences for culture, heritage, languages, people, and food.
- Narration and presentation audio controls.
- HTML Canvas particle animation for the final flag scene.
- Responsive styling for desktop and mobile screens.
- Vite development server and production build workflow.

## Tech Stack

- **React** — UI components and scene composition.
- **TypeScript** — Application logic and type definitions.
- **CSS** — Layout, visual styling, transitions, and animation.
- **HTML Canvas API** — Particle animation in the final scene.
- **Vite** — Local development and production builds.

## Getting Started

### Prerequisites

Install [Node.js](https://nodejs.org/) and npm.

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

### Build for production

```bash
npm run build
```

Vite writes the production build to `dist/`.

## Project Assets

The presentation loads its media from the project's public assets. The scene configuration currently references these directories and files:

```text
public/
├── culture/
│   └── Nigeria_culture_optimized.mp4
├── heritage/
│   ├── Nigeria_heritage_optimized.mp4
│   ├── heritae1.jpeg
│   ├── heritage2.jpeg
│   └── heritage3.jpeg
├── tribe/
│   ├── housa.jpeg
│   ├── igbo.jpeg
│   └── yorouba.jpeg
├── people/
│   ├── people1.jpeg
│   ├── people2.jpeg
│   ├── people3.jpeg
│   ├── people4.jpeg
│   └── Nigeria_people.webp
└── food/
    ├── food1.jpeg
    ├── food2.jpeg
    ├── food3.jpg
    └── food4.jpeg
```

Keep filenames and directory names consistent with the scene configuration. In particular, the existing asset names include spellings such as `heritae1.jpeg`, `housa.jpeg`, and `yorouba.jpeg`; renaming those files requires updating their references in the code as well.

## Deployment

The project can be built for static hosting, including GitHub Pages. For a repository published at `https://osaiEmma.github.io/9ja-Independence/`, Vite's `base` option should match the repository path:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    base: "/9ja-Independence/",
});
```

Use the matching base URL when constructing public asset paths so images, videos, and audio load correctly on the deployed site.

## Project Goal

This project is intended as an art presentation, not a conventional information website. It uses motion, narration, geography, and Nigerian cultural imagery to create a connected visual story about independence and national identity.

**Celebrating Nigeria. Honouring our diversity. Telling our story.** 🇳🇬
