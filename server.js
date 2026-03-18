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
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://rov-crowdsourcing.pages.dev/app/codes", {
    waitUntil: "networkidle"
  });

  setInterval(async () => {
    try {
      await page.reload();

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

        io.emit("newCode", latest); // 🚀 ส่ง realtime
      }

    } catch (err) {
      console.log("ERROR:", err);
    }
  }, 3000);
}

// API สำรอง
app.get("/codes", (req, res) => {
  res.json(lastCode ? [lastCode] : []);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🔥 running on", PORT);
  startScraper();
});