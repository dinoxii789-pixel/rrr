const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { chromium } = require("playwright");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());

let lastCode = null;

async function startScraper() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://rov-crowdsourcing.pages.dev/app/codes", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  console.log("✅ Scraper started");

  setInterval(async () => {
    try {
      await page.reload({ waitUntil: "domcontentloaded" });

      const codes = await page.evaluate(() => {
        const elements = document.querySelectorAll("h3");

        let raw = Array.from(elements)
          .map(el => el.innerText.trim());

        raw = raw.filter(text => /^[A-Z0-9]{6,}$/.test(text));

        return [...new Set(raw)];
      });

      const latest = codes[0];

      if (latest && latest !== lastCode) {
        lastCode = latest;

        console.log("🔥 NEW CODE:", latest);

        io.emit("newCode", latest);
      }

    } catch (err) {
      console.log("❌ ERROR:", err.message);
    }
  }, 8000); // 🔥 เพิ่ม delay กันโดนบล็อก
}

// หน้า root (กัน Cannot GET /)
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    latestCode: lastCode || "ยังไม่มีโค้ด"
  });
});

// API
app.get("/codes", (req, res) => {
  res.json(lastCode ? [lastCode] : []);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log("🔥 running on", PORT);
  await startScraper();
});
