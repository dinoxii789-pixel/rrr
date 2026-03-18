const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const http = require("http");
const { Server } = require("socket.io");
const fetch = require("node-fetch");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

let lastCode = null;
let userTokens = [];

// 📲 รับ token
app.post("/save-token", (req, res) => {
  const token = req.body.token;
  if (token && !userTokens.includes(token)) {
    userTokens.push(token);
    console.log("📲 Token:", token);
  }
  res.sendStatus(200);
});

// 🔔 ส่ง push
async function sendPush(code) {
  for (let token of userTokens) {
    await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": "BN-tcElYBKbz8KPhiwGLjX3jb6VZcLD55s3Fkglr87RvKQ-lgyj-81K4BzIs1CA4E9fB9sLnPgxIo1QYlaBME8k",
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

// ⚡ ดึงโค้ดแบบเบา
async function fetchCodes() {
  try {
    const { data } = await axios.get("https://rov-crowdsourcing.pages.dev/app/codes");

    const $ = cheerio.load(data);

    let codes = [];

    $("h3").each((i, el) => {
      const text = $(el).text().trim();
      if (/^[A-Z0-9]{6,}$/.test(text)) {
        codes.push(text);
      }
    });

    return [...new Set(codes)];

  } catch (e) {
    console.log("ERROR:", e.message);
    return [];
  }
}

// 🔁 loop
setInterval(async () => {
  const codes = await fetchCodes();
  const latest = codes[0];

  if (latest && latest !== lastCode) {
    lastCode = latest;

    console.log("🔥 NEW:", latest);

    io.emit("newCode", latest);
    sendPush(latest);
  }
}, 3000);

// API
app.get("/codes", (req, res) => {
  res.json(lastCode ? [lastCode] : []);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🔥 running on", PORT);
});
