import playwright from "/Users/rickbest/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.js";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const { chromium } = playwright;
const outDir = path.resolve("assets");
const outFile = path.join(outDir, "arc-signal-receipts-demo.webm");

const slides = [
  {
    title: "Arc Signal Receipts",
    subtitle: "Paid, verifiable AI market signals on Arc Testnet",
    bullets: [
      "AI agent creates a structured market signal",
      "Signal is hashed into a signed reasoning receipt",
      "Buyer unlocks access with a small USDC payment intent"
    ]
  },
  {
    title: "Agentic Payment Flow",
    subtitle: "USDC-denominated access before settlement",
    bullets: [
      "Merchant verifies payer, merchant, service ID, amount, expiry, and signature",
      "Nonce replay protection blocks duplicate access attempts",
      "Fulfilled requests are batched for Arc Testnet settlement"
    ]
  },
  {
    title: "Working MVP",
    subtitle: "TypeScript demo and tests are public",
    bullets: [
      "npm run build",
      "npm test",
      "npm run demo:agora",
      "Outputs receiptVerification: ok and settlementBatch.status: submitted"
    ]
  },
  {
    title: "Circle / Arc Stack",
    subtitle: "Built for the Stablecoin Commerce Stack Challenge",
    bullets: [
      "USDC as the payment asset",
      "Arc Testnet as the settlement environment",
      "Circle Wallets, Gateway, and Nanopayments as the product path"
    ]
  }
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.setContent(`<!doctype html>
<html>
<body style="margin:0;background:#0b0f14;">
<canvas id="c" width="1280" height="720"></canvas>
<script>
const slides = ${JSON.stringify(slides)};
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const durationMs = 20000;
const slideMs = durationMs / slides.length;

function wrap(text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function draw(t) {
  const slideIndex = Math.min(slides.length - 1, Math.floor(t / slideMs));
  const local = (t - slideIndex * slideMs) / slideMs;
  const slide = slides[slideIndex];

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0b0f14");
  g.addColorStop(0.55, "#142324");
  g.addColorStop(1, "#1e2b12");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255, 230, 80, 0.22)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const x = 120 + i * 145 + Math.sin(t / 700 + i) * 12;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 260, H);
    ctx.stroke();
  }

  ctx.fillStyle = "#f5e94d";
  ctx.fillRect(72, 70, 118, 14);
  ctx.font = "600 26px Arial";
  ctx.fillStyle = "#f6f7ec";
  ctx.fillText("ARC SIGNAL RECEIPTS", 72, 118);

  const ease = 1 - Math.pow(1 - local, 3);
  ctx.globalAlpha = Math.min(1, local * 4);
  ctx.font = "700 64px Arial";
  ctx.fillStyle = "#ffffff";
  for (const [i, line] of wrap(slide.title, 930).entries()) {
    ctx.fillText(line, 92, 225 + i * 72 - (1 - ease) * 22);
  }

  ctx.font = "400 30px Arial";
  ctx.fillStyle = "#cfe4db";
  for (const [i, line] of wrap(slide.subtitle, 980).entries()) {
    ctx.fillText(line, 96, 330 + i * 40);
  }

  ctx.font = "400 30px Arial";
  ctx.fillStyle = "#eef4e7";
  let y = 430;
  for (const bullet of slide.bullets) {
    ctx.fillStyle = "#f5e94d";
    ctx.beginPath();
    ctx.arc(105, y - 9, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#eef4e7";
    for (const line of wrap(bullet, 980)) {
      ctx.fillText(line, 130, y);
      y += 38;
    }
    y += 14;
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(92, 650, 1096, 10);
  ctx.fillStyle = "#f5e94d";
  ctx.fillRect(92, 650, 1096 * (t / durationMs), 10);

  ctx.font = "400 22px Arial";
  ctx.fillStyle = "#aeb8af";
  ctx.fillText("github.com/rick-best/arc-agent-pay", 92, 690);
}

window.recordDemo = () => new Promise((resolve, reject) => {
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
  const chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onerror = e => reject(e.error || e);
  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const buffer = await blob.arrayBuffer();
    resolve(Array.from(new Uint8Array(buffer)));
  };
  recorder.start();
  const start = performance.now();
  function frame(now) {
    const elapsed = Math.min(durationMs, now - start);
    draw(elapsed);
    if (elapsed < durationMs) requestAnimationFrame(frame);
    else recorder.stop();
  }
  requestAnimationFrame(frame);
});
</script>
</body>
</html>`);

const bytes = await page.evaluate(() => window.recordDemo());
await browser.close();

await import("node:fs/promises").then(({ writeFile }) => writeFile(outFile, Buffer.from(bytes)));
console.log(outFile);
