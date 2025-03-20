import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cartSlice';
import { Helmet } from "react-helmet-async";
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:8000/v1/products/${productId}`);
        if (!response.ok) {
          throw new Error(`Lỗi ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const showToast = (message) => {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2000);
  };

  const handleAddToCart = () => {
    if (product) {
      dispatch(addToCart({ 
        productId: product.productId, // Đảm bảo dùng đúng ID
        name: product.name, 
        price: product.price, 
        image: product.image, 
        quantity
      }));
      showToast(`Đã thêm ${quantity} "${product.name}" vào giỏ hàng!`);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => navigate("/cart"), 1000);
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (error) return <p>{error}</p>;
  if (!product) return <p>Không tìm thấy sản phẩm!</p>;

  return (
    <div className="product-detail-container">
      <Helmet>
        <title>{product.name} - Coffee shop</title>
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.image} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="product" />
      </Helmet>

      <div className="product-image">
        <img src={product.image || "/placeholder.jpg"} alt={product.name} />
      </div>
      <div className="product-info">
        <h1 className="product-name">{product.name}</h1>
        <p className="product-price">{product.price} VNĐ</p>
        <p className="product-description">{product.description}</p>
        <p className="product-category">
          Danh mục: {product.categoryId?.name || "Không xác định"}
        </p>

        <div className="quantity-controls">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
          <input type="text" value={quantity} readOnly />
          <button onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>

        <div className="action-buttons">
          <button className="add-to-cart" onClick={handleAddToCart}>Thêm vào giỏ</button>
          <button className="buy-now" onClick={handleBuyNow}>Mua ngay</button>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-button"
          >
            Chia sẻ lên Facebook
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
