const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', true);

// In-memory storage for coupons and claimed IPs
const coupons = ["COUPON1", "COUPON2", "COUPON3", "COUPON4", "COUPON5"];
let currentIndex = 0;
const claimedIPs = new Map(); // { ip: timestamp }

// Abuse prevention: Check if IP is blocked
const isIPBlocked = (ip) => {
  const lastClaimTime = claimedIPs.get(ip);
  if (lastClaimTime) {
    const currentTime = Date.now();
    const timeDiff = (currentTime - lastClaimTime) / (1000 * 60); // in minutes
    return timeDiff; // Block for 1 hour
  }
  return false;
};

// API to claim a coupon
app.get("/api/claim-coupon", (req, res) => {
  const userIP = req.ip;
  const cookieId = req.cookies.coupon_claimed

  // Abuse prevention: Check IP and cookies
  const timeDiff = 60 - Math.floor(isIPBlocked(userIP))
  if (isIPBlocked(userIP) && timeDiff <= 60 && timeDiff > 0) {
    return res.status(429).json({ 
      message: `You can claim another coupon after ${timeDiff} minutes`,
      prevCoupon:  claimedIPs.get(userIP)
    
    });
  }

  // Assign the next coupon
  const coupon = coupons[currentIndex];
  currentIndex = (currentIndex + 1) % coupons.length; // Round-robin logic

  // Block the IP for 1 hour
  claimedIPs.set(userIP, Date.now());

  // Set a cookie to track the user
  res.cookie("coupon_claimed", true, { maxAge: 1 * 1 * 1000 }); // 1 hour

  res.json({ message: "Coupon claimed successfully!", coupon });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});