const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { chromium } = require("playwright");
const fetch = require("node-fetch");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

let lastCode = null;
let userTokens = []; // 🔥 เก็บ token

// 📲 รับ token จาก frontend
app.post("/save-token", (req, res) => {
  const token = req.body.token;
  if (token && !userTokens.includes(token)) {
    userTokens.push(token);
    console.log("📲 New token:", token);
  }
  res.sendStatus(200);
});

// 🔔 ส่ง push
async function sendPush(code) {
  for (let token of userTokens) {
    await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": "key=YOUR_FIREBASE_SERVER_KEY",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: "🔥 โค้ดใหม่!",
          body: code
        }
      })
    });
  }
}

async function startScraper() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://rov-crowdsourcing.pages.dev/app/codes");

  setInterval(async () => {
    try {
      await page.reload();

      const codes = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("h3"))
          .map(el => el.innerText.trim())
          .filter(x => /^[A-Z0-9]{6,}$/.test(x));
      });

      const latest = codes[0];

      if (latest && latest !== lastCode) {
        lastCode = latest;

        console.log("🔥 NEW:", latest);

        io.emit("newCode", latest);
        sendPush(latest); // 🔥 ยิงมือถือ
      }

    } catch (e) {
      console.log(e);
    }
  }, 3000);
}

app.get("/codes", (req, res) => {
  res.json(lastCode ? [lastCode] : []);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🔥 running", PORT);
  startScraper();
});
