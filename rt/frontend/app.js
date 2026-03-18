const API_URL = "http://localhost:3000/codes";

let lastCode = null;

async function fetchLatestCode() {
  try {
    const res = await fetch(API_URL);
    const codes = await res.json();

    if (!codes || codes.length === 0) return;

    const latest = codes[0]; // 👈 เอาตัวล่าสุด

    console.log("LATEST:", latest);

    // ถ้าเป็นโค้ดใหม่
    if (latest !== lastCode) {
      lastCode = latest;

      showCode(latest);
      notify(latest);
    }

  } catch (e) {
    console.log("ERROR:", e);
  }
}

// แสดงโค้ด
function showCode(code) {
  const box = document.getElementById("latestCode");
  box.textContent = code;
}

// แจ้งเตือน
function notify(code) {
  if (Notification.permission === "granted") {
    new Notification("🔥 โค้ดใหม่ล่าสุด!", {
      body: code
    });
  }
}

// ปุ่มเริ่ม
document.getElementById("startBtn").onclick = () => {
  Notification.requestPermission();

  fetchLatestCode(); // โหลดทันที
  setInterval(fetchLatestCode, 3000); // เช็คทุก 3 วิ
};