const express = require("express");
const cors = require("cors");
const axios = require("axios");
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

// ✅ หน้า root
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "🔥 ROV Shadow Notify API",
    latestCode: lastCode || "ยังไม่มีโค้ด"
  });
});

// 📲 รับ token
app.post("/save-token", (req, res) => {
  const token = req.body.token;
  if (token && !userTokens.includes(token)) {
    userTokens.push(token);
    console.log("📲 Token:", token);
  }
  res.sendStatus(200);
});

// 🔔 push
async function sendPush(code) {
  for (let token of userTokens) {
    try {
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
    } catch (e) {
      console.log("Push error:", e.message);
    }
  }
}

// ✅ ดึงโค้ด (ใช้ API ตรง)
async function fetchCodes() {
  try {
    const { data } = await axios.get(
      "https://rov-crowdsourcing.pages.dev/api/codes"
    );
    return data;
  } catch (e) {
    console.log("ERROR:", e.message);
    return [];
  }
}

// 🔁 loop
function loop() {
  const delay = Math.floor(Math.random() * 5000) + 8000;

  setTimeout(async () => {
    const codes = await fetchCodes();
    const latest = codes[0];

    if (latest && latest !== lastCode) {
      lastCode = latest;

      console.log("🔥 NEW:", latest);

      io.emit("newCode", latest);
      sendPush(latest);
    }

    loop();
  }, delay);
}

// API
app.get("/codes", (req, res) => {
  res.json(lastCode ? [lastCode] : []);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🔥 running on", PORT);
  loop();
});
