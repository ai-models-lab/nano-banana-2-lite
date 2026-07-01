<div align="center">

# 🍌 Nano Banana 2 Lite Playground & Benchmark Hub

[![GitHub stars](https://img.shields.io/github/stars/ai-models-lab/nano-banana-2-lite?style=for-the-badge&color=amber&logo=github)](https://github.com/ai-models-lab/nano-banana-2-lite/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ai-models-lab/nano-banana-2-lite?style=for-the-badge&color=yellow&logo=github)](https://github.com/ai-models-lab/nano-banana-2-lite/network/members)
[![License](https://img.shields.io/github/license/ai-models-lab/nano-banana-2-lite?style=for-the-badge&color=slate)](LICENSE)
[![Built with React](https://img.shields.io/badge/Built%20With-React%2019-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Powered by Gemini](https://img.shields.io/badge/AI-Gemini%203.1%20Flash--Lite-orange?style=for-the-badge&logo=google-gemini)](https://ai.google.dev)

<p align="center">
  <b>The fastest, most cost-efficient full-stack prompt engineering playground & capability benchmark suite for Google's newest Imagen 3.1 Flash-Lite model (Nano Banana 2 Lite).</b>
</p>

---

</div>

An interactive, full-stack prompt engineering workspace and capability evaluator for Google's lightning-fast **Nano Banana 2 Lite** (`gemini-3.1-flash-lite-image` / Imagen 3.1 Flash-Lite) image generation model.

This project provides designers, prompt engineers, and developer teams with an elegant, real-time environment to prototype prompts, apply style transfers, examine text rendering alignment, and compare generation latency/cost metrics.

---

## 🚀 Key Features

* **Instant Text-to-Image Canvas:** Play with custom prompts, select style qualifiers (e.g., *Cyberpunk*, *Photorealistic*, *Studio Lighting*), and generate images using the standard aspect ratios (`1:1`, `16:9`, `9:16`, `4:3`, `3:4`).
* **Image Editing & Style Transfer:** Upload any starting image (PNG/JPEG) and supply a natural language edit instruction (e.g., *"Convert this to a watercolor painting"*) to test the model's high-speed redrawing capabilities.
* **Predefined Capability Benchmarks:** Load pre-made challenging benchmark prompts targeting tough image synthesis tests (Text Rendering, High-Speed Macro Splashes, Minimalist Vector Logos, Atmospheric Landscapes) to evaluate prompt adherence.
* **Granular Performance Metrics:** Every generation measures and visualizes:
  * **Latency:** Compare the Lite model's speedy **4-5 second** response directly against standard models (~20 seconds).
  * **Cost Estimation:** Built-in budget calculations based on the ultra-low model rate of approximately `$0.034 per 1,000 images`.
  * **SynthID Watermark:** Displays confirmation of Google's invisible digital authenticity watermarking.
* **Session Runs Gallery:** Local browser history caching to save previous generations across page reloads.

---

## 🛠️ Technology Stack

* **Frontend Framework:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Modern Glassmorphic Design Theme.
* **Backend API Gateway:** Express.js proxying requests securely to prevent API key exposure in client bundles.
* **Vite Middleware Integration:** Blazing fast hot module replacement (HMR) programmatically integrated into the Express pipeline during development.
* **AI Engine Client:** Official Google Gen AI SDK (`@google/genai`).

---

## 📦 Installation & Local Setup

Follow these straightforward steps to run the playground locally:

### 1. Clone the Repository
```bash
git clone https://github.com/ai-models-lab/nano-banana-2-lite.git
cd nano-banana-2-lite
```

### 2. Install Project Dependencies
Ensure you have Node.js (version 18 or higher) installed, then execute:
```bash
npm install
```

### 3. Configure Your Environment Variables
Create a `.env` file in the root directory (you can copy `.env.example` as a starting point):
```bash
cp .env.example .env
```
Open `.env` and configure your Google AI Studio API key:
```env
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY_HERE"
```

### 4. Boot the Full-Stack Developer Server
Launch the unified React + Express development pipeline:
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`** to start experimenting!

---

## 📋 Available Scripts

In the project directory, you can run:

* **`npm run dev`**: Starts the Express server and Vite development middleware at `http://localhost:3000`.
* **`npm run build`**: Compiles the React SPA static files into the `./dist` folder for optimized production delivery.
* **`npm run start`**: Boots the production-grade Express server which serves the statically-compiled frontend and acts as the API gateway.
* **`npm run lint`**: Runs TypeScript semantic and syntax type-checking (`tsc --noEmit`).

---

## 🛡️ API & Key Security

This project is architected with a strict **full-stack separation of concerns**:
* All calls to the `@google/genai` SDK are executed **exclusively on the server-side** in `server.ts`.
* The frontend initiates calls via local API endpoints (`/api/generate` and `/api/edit`).
* Your `GEMINI_API_KEY` is never exposed, imported, or bundled into browser assets.

---

## 🌐 Model Aliases Used

This codebase is configured to target official Google image synthesis models:
* **Nano Banana 2 Lite:** `gemini-3.1-flash-lite-image` (Primary low-latency target)
* **Nano Banana 2:** `gemini-3.1-flash-image` (High-resolution, supports custom scales)
* **Nano Banana Pro:** `gemini-3-pro-image` (Premium commercial tier)

---

## 📄 License
SPDX-License-Identifier: Apache-2.0
