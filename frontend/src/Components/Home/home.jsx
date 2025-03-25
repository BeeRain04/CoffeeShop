import React, { useEffect, useState } from "react";
import ProductCard from "../ProductCard/ProductCard.jsx";
import Slider from "../Slider/Slider.jsx"; // Import slider
import Chatbot from "../Chatbot/Chatbot.jsx";
import "./Home.css";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [filteredProducts, setFilteredProducts] = useState([]);

  // 🔥 Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8; // Số sản phẩm trên mỗi trang

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:8000/v1/products");
        const data = await response.json();
        
        // Thêm thông tin category vào mỗi sản phẩm
        const productsWithCategories = await Promise.all(
          data.map(async (product) => {
            try {
              const categoryResponse = await fetch(`http://localhost:8000/v1/categories/${product.categoryId}`);
              const categoryData = await categoryResponse.json();
              return { ...product, categoryName: categoryData.name };
            } catch (error) {
              console.error("Lỗi khi lấy danh mục:", error);
              return { ...product, categoryName: "Không xác định" };
            }
          })
        );
  
        setProducts(productsWithCategories);
        setFilteredProducts(productsWithCategories);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
      }
    };
  
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8000/v1/categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
      }
    };
  
    fetchProducts();
    fetchCategories();
  }, []);  

  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.categoryId === selectedCategory);
    }       

    if (search.trim() !== "") {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      filtered = filtered.filter((product) => product.price >= min && product.price <= max);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi bộ lọc
  }, [search, selectedCategory, priceRange, products]);

  // 🔥 Xử lý phân trang
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="home">
      <Slider />

      {/* Thanh tìm kiếm */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Bộ lọc */}
      <div className="filters">
        <div className="filter-group">
          <label>Danh mục:</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">Tất cả</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={String(category.categoryId)}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Giá:</label>
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="0-50000">Dưới 50K</option>
            <option value="50000-200000">50K - 200K</option>
            <option value="200000-500000">200K - 500K</option>
            <option value="500000-1000000">500K - 1 Triệu</option>
            <option value="1000000-99999999">Trên 1 Triệu</option>
          </select>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="products-container">
        {currentProducts.length > 0 ? (
          currentProducts.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))
        ) : (
          <p className="no-products">Không tìm thấy sản phẩm nào.</p>
        )}
      </div>

      {/* Phân trang */}
      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
          {"<"}
        </button>
        <span>Trang {currentPage} / {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
          {">"}
        </button>
      </div>
      <Chatbot />
      {/* 🔥 Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3>Về chúng tôi</h3>
            <p>Chúng tôi cung cấp những sản phẩm tốt nhất với giá cả hợp lý.</p>
          </div>
          <div className="footer-section">
            <h3>Hỗ trợ khách hàng</h3>
            <ul>
              <li><a href="#">Chính sách bảo hành</a></li>
              <li><a href="#">Chính sách đổi trả</a></li>
              <li><a href="#">Hướng dẫn mua hàng</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Kết nối với chúng tôi</h3>
            <ul className="social-links">
              <li><a href="#"><i className="fab fa-facebook"></i> Facebook</a></li>
              <li><a href="#"><i className="fab fa-instagram"></i> Instagram</a></li>
              <li><a href="#"><i className="fab fa-twitter"></i> Twitter</a></li>
            </ul>
          </div>
          {/* 🔥 Thêm bản đồ nhỏ */}
          <div className="footer-section map">
            <h3>Địa chỉ của chúng tôi</h3>
            <iframe
              title="Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.290040323656!2d106.5980515731709!3d10.865530357547657!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752b088de30f3b%3A0xd2140740d360f705!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBOZ2_huqFpIG5n4buvIC0gVGluIGjhu41jIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaCAoSFVGTElUKSBDxqEgc-G7nyBIw7NjIE3DtG4!5e0!3m2!1svi!2s!4v1741071147205!5m2!1svi!2s"
              width="250"
              height="150"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
        <p className="footer-bottom">© 2025 Coffee Shop. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
