import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const navigate = useNavigate();

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePayment = async () => {
    const orderId = "DH" + Date.now();
    try {
      const response = await fetch("https://coffeeshop-com.onrender.com/v1/payment/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalPrice, orderId, cartItems }),
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
    <div className="checkout-container">
      <h2 className="checkout-title">Xác nhận Thanh toán</h2>

      {/* Bảng sản phẩm */}
      <div className="checkout-table">
        <div className="checkout-header">
          <span>Ảnh</span>
          <span>Tên sản phẩm</span>
          <span>Số lượng</span>
          <span>Đơn giá</span>
          <span>Tổng</span>
        </div>

        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div key={item.id} className="checkout-row">
              <img src={item.image} alt={item.name} className="checkout-item-image" />
              <span className="checkout-item-name">{item.name}</span>
              <span>{item.quantity}</span>
              <span>{item.price.toLocaleString()} VND</span>
              <span>{(item.price * item.quantity).toLocaleString()} VND</span>
            </div>
          ))
        ) : (
          <p className="empty-cart">Giỏ hàng trống!</p>
        )}
      </div>

      {/* Tổng tiền */}
      <div className="checkout-total">
        <span>Tổng tiền:</span>
        <strong>{totalPrice.toLocaleString()} VND</strong>
      </div>

      {/* Nút thanh toán */}
      <button className="checkout-button" onClick={handlePayment} disabled={cartItems.length === 0}>
        Thanh toán qua VNPay
      </button>
    </div>
  );
};

export default Checkout;
