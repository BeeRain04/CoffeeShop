import { useState } from "react";
import "./Checkout.css";

const Checkout = () => {
  const [amount, setAmount] = useState(100000);

  const handlePayment = async () => {
    const orderId = "DH" + Date.now();

    try {
      const response = await fetch("http://localhost:8000/api/vnpay/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, orderId }),
      });

      const data = await response.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert("Có lỗi xảy ra, vui lòng thử lại!");
      }
    } catch (error) {
      alert("Lỗi hệ thống!");
    }
  };

  return (
    <div className="checkout-page">
      <h2 className="checkout-title">Thanh toán VNPay</h2>
      <label className="checkout-label">Số tiền (VND):</label>
      <input
        type="number"
        className="checkout-input"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button className="checkout-button" onClick={handlePayment}>
        Thanh toán qua VNPay
      </button>
    </div>
  );
};

export default Checkout;
