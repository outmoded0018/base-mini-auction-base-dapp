import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");

const W = 1284;
const H = 2778;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const result = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      result.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) result.push(current);
  return result;
}

function frame(content, bg = "#0b0f16") {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#132130"/>
      </linearGradient>
      <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(240 240) rotate(35) scale(920 920)">
        <stop offset="0%" stop-color="#1f4b73" stop-opacity=".9"/>
        <stop offset="100%" stop-color="#1f4b73" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    ${content}
  </svg>`;
}

function header(title, subtitle) {
  const lines = wrap(subtitle, 33);
  return `
    <text x="72" y="112" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#62c5ff">BASE MINI AUCTION</text>
    <text x="72" y="232" font-family="Arial, sans-serif" font-size="92" font-weight="900" fill="#f4f7fb">${esc(title)}</text>
    ${lines.map((line, index) => `<text x="76" y="${308 + index * 44}" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#a9bfd5">${esc(line)}</text>`).join("")}
  `;
}

function pill(x, y, text, fill, fg = "#041018") {
  return `
    <rect x="${x}" y="${y}" rx="28" width="${text.length * 16 + 70}" height="56" fill="${fill}" stroke="#22364b" stroke-width="3"/>
    <text x="${x + 30}" y="${y + 37}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function panel(x, y, width, height, title, lines, accent = "#62c5ff") {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="32" fill="#0d141d" stroke="#22364b" stroke-width="4"/>
      <text x="${x + 28}" y="${y + 54}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${accent}">${esc(title)}</text>
      ${lines.map((line, index) => `<text x="${x + 28}" y="${y + 118 + index * 40}" font-family="Arial, sans-serif" font-size="34" font-weight="${index === 0 ? 900 : 700}" fill="${index === 0 ? "#f4f7fb" : "#a9bfd5"}">${esc(line)}</text>`).join("")}
    </g>
  `;
}

function button(x, y, width, text, fill, fg = "#041018") {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="96" rx="48" fill="${fill}"/>
    <text x="${x + width / 2}" y="${y + 61}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function screenshot1() {
  const content = `
    ${header("Create a small auction.", "List one item, define a starting bid, and launch a Base-native auction from a clean mobile board.")}
    ${pill(72, 408, "Seller flow", "#62c5ff")}
    ${pill(246, 408, "Fast setup", "#ffffff", "#0d1016")}
    ${panel(72, 540, 1140, 286, "Create auction", ["Base launch poster", "Start bid: 0.002 ETH", "Duration: 12h"], "#62c5ff")}
    ${panel(72, 872, 548, 246, "Listing note", ["A one-day mini auction", "Built for mobile bidding on Base"], "#78d7ff")}
    ${panel(664, 872, 548, 246, "Auction rules", ["Highest bid wins", "Previous top bid auto-refunds"], "#78d7ff")}
    ${panel(72, 1166, 1140, 290, "Preview board", ["Current bid: 0.002 ETH", "Top bidder: none yet", "Timer: 12h left"], "#62c5ff")}
    ${panel(72, 1508, 1140, 250, "Why it works", ["One listing action", "One live bidding lane", "One settlement step"], "#78d7ff")}
    ${button(72, 2522, 1140, "Create on Base", "#62c5ff")}
  `;
  return frame(content);
}

function screenshot2() {
  const content = `
    ${header("Live bidding board.", "Users can see the current high bid, top bidder, and time remaining without losing the action path.")}
    ${pill(72, 408, "0x9936...9652 connected", "#62c5ff")}
    ${pill(402, 408, "Auction ID 12", "#ffffff", "#0d1016")}
    ${panel(72, 536, 360, 246, "Current bid", ["0.0060 ETH", "Bid has moved above the floor"], "#62c5ff")}
    ${panel(462, 536, 360, 246, "Top bidder", ["0x8ab2...77f1", "Lead wallet updated live"], "#62c5ff")}
    ${panel(852, 536, 360, 246, "Time left", ["8h 14m", "Auction remains active"], "#62c5ff")}
    ${panel(72, 840, 1140, 310, "Listing", ["Base launch poster", "Short-form auction with a mobile-first bid flow.", "Seller: 0x9936...9652"], "#78d7ff")}
    ${panel(72, 1208, 1140, 286, "Bid panel", ["Bid amount: 0.007 ETH", "Minimum next bid is above current high bid", "Wallet is ready to confirm"], "#62c5ff")}
    ${panel(72, 1544, 1140, 254, "Status", ["Highest bid updated on Base.", "Previous bidder was refunded automatically."], "#78d7ff")}
    ${button(72, 2522, 1140, "Place bid", "#ffffff")}
  `;
  return frame(content, "#0a0f15");
}

function screenshot3() {
  const content = `
    ${header("Settle the winner.", "When the timer ends, the auction closes cleanly and the winning bid is paid out to the seller.")}
    ${pill(72, 408, "Ended", "#ffffff", "#0d1016")}
    ${pill(210, 408, "Settlement ready", "#62c5ff")}
    ${panel(72, 540, 548, 276, "Winner", ["0x8ab2...77f1", "Winning bid: 0.0090 ETH", "Auction ID: 12"], "#62c5ff")}
    ${panel(664, 540, 548, 276, "Seller payout", ["0.0090 ETH", "Sent when settlement confirms", "No manual bookkeeping"], "#62c5ff")}
    ${panel(72, 874, 1140, 306, "Settlement receipt", ["Auction settled on Base.", "Winning bidder remains visible.", "Seller receives the highest bid."], "#78d7ff")}
    ${panel(72, 1238, 1140, 290, "Auction summary", ["Item: Base launch poster", "Start bid: 0.002 ETH", "Final bid: 0.0090 ETH"], "#62c5ff")}
    ${panel(72, 1582, 1140, 254, "Post-auction state", ["Timer complete", "Winner locked in", "Board stays readable for mobile users"], "#78d7ff")}
    ${button(72, 2522, 1140, "Settle auction", "#62c5ff")}
  `;
  return frame(content, "#0b1018");
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#0d1016"/>
    <rect x="138" y="138" width="748" height="748" rx="96" fill="#101723" stroke="#2a4359" stroke-width="24"/>
    <rect x="208" y="228" width="608" height="160" rx="30" fill="#62c5ff"/>
    <rect x="208" y="436" width="608" height="104" rx="24" fill="#132130" stroke="#2a4359" stroke-width="14"/>
    <rect x="208" y="586" width="276" height="152" rx="24" fill="#132130" stroke="#2a4359" stroke-width="14"/>
    <rect x="540" y="586" width="276" height="152" rx="24" fill="#132130" stroke="#2a4359" stroke-width="14"/>
    <path d="M330 246v88l-62 36" stroke="#041018" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M694 246v88l62 36" stroke="#041018" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="330" cy="246" r="20" fill="#041018"/>
    <circle cx="694" cy="246" r="20" fill="#041018"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0d1016"/>
        <stop offset="100%" stop-color="#132130"/>
      </linearGradient>
    </defs>
    <rect width="1910" height="1000" fill="url(#bg)"/>
    <text x="96" y="198" font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="#f4f7fb">Base Mini Auction</text>
    <text x="100" y="292" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#a9bfd5">Create compact auctions, accept live bids, and settle the winner on Base.</text>
    ${pill(100, 348, "Seller flow", "#62c5ff")}
    ${pill(278, 348, "Live bids", "#ffffff", "#0d1016")}
    ${button(100, 448, 430, "Create on Base", "#62c5ff")}
    ${button(560, 448, 430, "Place bid", "#ffffff")}
    ${panel(1186, 124, 624, 250, "Live board", ["Current bid: 0.0060 ETH", "Top bidder: 0x8ab2...77f1", "Time left: 8h 14m"], "#62c5ff")}
    ${panel(1186, 420, 624, 250, "Settlement", ["Winner locked after timer ends", "Seller receives final bid"], "#78d7ff")}
    ${panel(1186, 734, 624, 180, "Auction state", ["Compact, mobile-first, and clearly transactional"], "#62c5ff")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

const manifest = {
  generatedAt: new Date().toISOString(),
  files,
};

await writeFile(
  join(outDir, "asset-manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8",
);

for (const file of files) {
  console.log(file);
}
