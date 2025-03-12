import React from 'react';
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/cartSlice"; 
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addToCart(product));

    // ✅ Hiển thị thông báo tự động biến mất
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.innerText = `Đã thêm "${product.name}" vào giỏ hàng!`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove(); // ✅ Tự động ẩn sau 2 giây
    }, 2000);
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.productId}`} className="product-link">
        <img
          src={product.image || '/placeholder.jpg'}
          alt={product.name}
          className="product-image"
        />
        <div className="product-details">
          <h2 className="product-name">{product.name}</h2>
          <p className="product-price">{product.price} VNĐ</p>
        </div>
      </Link>
      <button className="add-to-cart-btn" onClick={handleAddToCart}>
        Thêm vào giỏ hàng
      </button>
    </div>
  );
};

export default ProductCard;
