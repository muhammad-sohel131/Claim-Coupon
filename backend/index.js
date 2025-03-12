const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://coupon-frontend.vercel.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", true); 

// In-memory storage for coupons and claimed IPs
const coupons = ["COUPON1", "COUPON2", "COUPON3", "COUPON4", "COUPON5"];
let currentIndex = 0; 
const claimedIPs = new Map(); // { ip: { lastClaimTime, coupon } }

// Abuse prevention: Check if IP is blocked
const isIPBlocked = (ip) => {
  const userData = claimedIPs.get(ip);
  if (userData) {
    const lastClaimTime = userData.lastClaimTime;
    const currentTime = Date.now();
    const timeDiff = (currentTime - lastClaimTime) / (1000 * 60); 
    return timeDiff < 5; // Block for 5 minutes
  }
  return false;
};

// API to claim a coupon
app.get("/api/claim-coupon", (req, res) => {
  const userIP = req.ip;
  const cookieId = req.cookies.coupon_claimed;

  // Calculate time remaining if IP is blocked
  const userData = claimedIPs.get(userIP);
  const timeDiff = userData
    ? Math.ceil(5 - (Date.now() - userData.lastClaimTime) / (1000 * 60)) // Time remaining in minutes
    : 0;

  // Handle edge case where timeDiff is 0 or negative
  if (timeDiff <= 0) {
    claimedIPs.delete(userIP); // Unblock the IP
  }

  // Abuse prevention: Check IP and cookies
  if (timeDiff > 0) {
    return res.status(429).json({
      message: `You can claim another coupon after ${timeDiff} minutes.`,
      prevCoupon: userData?.coupon, 
    });
  }

  if (timeDiff <= 0 && cookieId) {
    return res.status(429).json({
      message: `You changed IP , But using same device`,
      prevCoupon: userData?.coupon, 
    });
  }

  

  // Assign the next coupon in round-robin fashion
  const coupon = coupons[currentIndex];
  currentIndex = (currentIndex + 1) % coupons.length; // Round-robin logic

  // Block the IP for 5 minutes and store the coupon
  claimedIPs.set(userIP, { lastClaimTime: Date.now(), coupon });

  // Set a cookie to track the user
  res.cookie("coupon_claimed", true, {
    maxAge: 5 * 60 * 1000, // 5 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  });

  res.json({ message: "Coupon claimed successfully!", coupon });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});