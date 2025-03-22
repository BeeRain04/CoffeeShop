import { useEffect, useState } from "react";
import "./PaymentResult.css";

const PaymentResult = () => {
  const [message, setMessage] = useState("Đang kiểm tra kết quả thanh toán...");

  useEffect(() => {
    const fetchPaymentResult = async () => {
      const query = window.location.search;
      try {
        const response = await fetch(`https://coffeeshop-com.onrender.com/v1/payment/vnpay-return${query}`);
        const data = await response.json();
        setMessage(data.message);
      } catch (error) {
        setMessage("Có lỗi xảy ra!");
      }
    };

    fetchPaymentResult();
  }, []);

  return (
    <div className="payment-result-page">
      <h2 className="payment-result-title">Kết quả thanh toán</h2>
      <p className="payment-result-message">{message}</p>
    </div>
  );
};

export default PaymentResult;
