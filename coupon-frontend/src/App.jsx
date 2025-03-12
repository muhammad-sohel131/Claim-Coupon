import React, { useState } from "react";
import axios from "axios";

const App = () => {
  const [coupon, setCoupon] = useState("");
  const [prevCoupon, setPrevCoupon] = useState("")
  const [message, setMessage] = useState("");

  const handleClaimCoupon = async () => {
    try {
      const response = await axios.get("https://coupon-provider.vercel.app/api/claim-coupon", {
        withCredentials: true,
      });
      setPrevCoupon('')
      setCoupon(response.data.coupon);
      setMessage(response.data.message);
    } catch (error) {
      setCoupon('')
      setPrevCoupon(error?.response?.data?.prevCoupon)
      setMessage(error.response?.data?.message || "An error occurred.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Claim Your Coupon</h1>
        <button
          onClick={handleClaimCoupon}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Claim Coupon
        </button>
        {message && <p className="mt-4 text-gray-700">{message}</p>}
        {prevCoupon && (
          <p className="mt-4 text-red-600 font-bold">Your Previous Coupon: {prevCoupon}</p>
        )}
        {coupon && (
          <p className="mt-4 text-green-600 font-bold">Your Coupon: {coupon}</p>
        )}
      </div>
    </div>
  );
};

export default App;