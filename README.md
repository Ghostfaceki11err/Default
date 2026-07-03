# Default Converter

**Default Converter** is a premium, high-performance, **100% client-side** media and document transcoder. It allows users to convert Word documents (`.docx`) to PDF, and transcode images (PNG, JPG, WebP) directly in their web browser. 

🚀 **[Live Demo](https://d3fau1t.netlify.app/)**

Since all conversion tasks are performed locally using the client's CPU and RAM, there are **no server hosting costs, no API rate limits, and absolute file privacy**.

---

## Key Features

* 📄 **Word to PDF Conversion:** Local layout parsing and rendering using [Mammoth.js](https://github.com/mwilliamson/mammoth.js) and [html2pdf.js](https://github.com/eKoopmans/html2pdf.js).
* 🖼️ **Image Transcoding:** Canvas-powered image adjustments supporting PNG, JPEG, and WebP formats.
* 🔒 **100% Private:** Files never leave the user's computer. No external APIs or database uploads are involved.
* ⚡ **Zero Processing Costs & Infinite Scalability:** Hosting is completely static. The client's hardware handles the processing workload, making the website cheap to run and immune to server crashes from high traffic.

* 🔌 **Self-contained Service Worker:** Uses `coi-serviceworker` to configure network isolation headers client-side, enabling secure browser-level thread sharing.

---

## Tech Stack

* **Structure:** HTML5 (Semantic elements)
* **Styling:** CSS3 (Frosted glass effects, keyframe background animations, responsive grids)
* **Logic:** Vanilla JavaScript (ES6 Modules)
* **Libraries (via CDN):**
  * `mammoth.browser.min.js` (Word parsing)
  * `html2pdf.bundle.min.js` (PDF creation)

---

## How to Run Locally

Because the application uses ES Modules (`import`/`export`), web browsers block imports on local files (`file://` protocol) due to security policies. You must run the application using a local web server:

### Option 1: VS Code Live Server (Easiest)
1. Open the project folder in VS Code.
2. Install the **Live Server** extension by Ritwick Dey.
3. Open `index.html` and click **Go Live** in the bottom-right status bar.

### Option 2: Python HTTP Server
Open your terminal inside the project directory and run:
```bash
python -m http.server 8080
```
Then navigate to `http://localhost:8080` in your web browser.

### Option 3: Node / npm
Open your terminal inside the project directory and run:
```bash
npx live-server
```
or
```bash
npx http-server
```

---

