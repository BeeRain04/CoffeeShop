import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { increaseQuantity, decreaseQuantity, removeFromCart } from "../../redux/cartSlice";
import { Link, useNavigate } from "react-router-dom";
import "./CartPage.css";

const CartPage = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Tính tổng tiền
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckout = () => {
    navigate("/checkout");
  };

  return (
    <div className="cart-container">
      <h2>Giỏ Hàng</h2>
      {cartItems.length === 0 ? (
        <p>Giỏ hàng của bạn đang trống.</p>
      ) : (
        <div>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Hình ảnh</th>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Tổng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
               <tr key={item.id}>
               <td><img src={item.image} alt={item.name} className="cart-image" /></td>
               <td>{item.name}</td>
               <td>{item.price} VNĐ</td>
               <td>
                 <button onClick={() => dispatch(decreaseQuantity(item.id))}>-</button>
                 <span>{item.quantity}</span>
                 <button onClick={() => dispatch(increaseQuantity(item.id))}>+</button>
               </td>
               <td>{item.price * item.quantity} VNĐ</td>
               <td>
                 <button onClick={() => dispatch(removeFromCart(item.id))}>Xóa</button>
               </td>
             </tr>
              ))}
            </tbody>
          </table>
          <div className="cart-summary">
            <h3>Tổng tiền: {totalPrice} VNĐ</h3>
            <button className="checkout-btn" onClick={handleCheckout}>Thanh toán</button>
            <Link to="/home" className="continue-shopping">Tiếp tục mua hàng</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
