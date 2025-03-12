import axios from 'axios';
import { useState, useEffect } from 'react';
import SidebarNav from '../SidebarNav/SidebarNav';
import './AddProduct.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'; 
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const navigate = useNavigate();
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [ingredients, setIngredients] = useState([{ id: '', quantity: '' }]);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const fetchIngredients = async () => {
    try {
      const response = await axios.get('http://localhost:8000/v1/inventory');
      setAvailableIngredients(response.data);
    } catch (error) {
      setError('Lỗi khi tải danh sách nguyên liệu.');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8000/v1/categories');
      setCategories(response.data);
    } catch (error) {
      setError('Lỗi khi tải danh sách danh mục.');
    }
  };

  useEffect(() => {
    fetchIngredients();
    fetchCategories();
  }, []);

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index].id = value; 
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { id: '', quantity: '' }]);
  };

  const removeIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Ràng buộc tên sản phẩm không có ký tự đặc biệt
    const productNameRegex = /^[\p{L}\p{N} .,()-]+$/u; // Hỗ trợ tiếng Việt và một số ký tự
    if (!productNameRegex.test(productName)) {
      setError('Tên sản phẩm không hợp lệ. Chỉ cho phép chữ, số, dấu cách và các ký tự: .,()-');
      return;
    }


    // Ràng buộc giá
    if (isNaN(price) || price <= 0 || price > 1000000) {
      setError('Giá phải là một số dương và tối đa là 1 triệu.');
      return;
    }

    // Ràng buộc mô tả không quá 500 ký tự
    if (description.length > 500) {
      setError('Mô tả không được quá 500 ký tự.');
      return;
    }

    // Tạo FormData
    const formData = new FormData();
    formData.append('name', productName);
    formData.append('price', Number(price));
    formData.append('description', description);
    if (image) {
      formData.append('image', image);
    }
    formData.append('categoryId', categoryId);
    
    // Ràng buộc nguyên liệu
    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      if (!ing.id || isNaN(ing.quantity) || ing.quantity <= 0) {
        setError('Một trong các nguyên liệu không hợp lệ (cần có ID và số lượng dương).');
        return;
      }
      formData.append(`ingredients[${i}][inventoryId]`, ing.id); // Sử dụng 'i' thay vì 'index'
      formData.append(`ingredients[${i}][quantity]`, Number(ing.quantity));
    }
    
    try {
      const response = await axios.post('http://localhost:8000/v1/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage('Sản phẩm đã được thêm thành công!');
      setProductName('');
      setPrice('');
      setDescription('');
      setImage(null);
      setIngredients([{ id: '', quantity: '' }]);
      setCategoryId('');
      setError('');
    } catch (error) {
      console.error("Error adding product:", error);
      setError('Lỗi khi thêm sản phẩm. Vui lòng thử lại.');
      setSuccessMessage('');
    }
  };


  return (
    <div className="container_div">
      <SidebarNav />
      <div className="add-product-container">
        <FontAwesomeIcon 
          icon={faArrowLeft} 
          className="back_btn_AddProduct" 
          onClick={() => navigate(-1)}
          title="Quay lại"
        />
        <h2 className="add-product-header">Thêm Sản Phẩm Mới</h2>
        {error && <div className="error-message-product">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="form-group">
            <label>Tên sản phẩm:</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label>Giá:</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label>Mô tả:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength="1000" // Giới hạn 500 ký tự
              className="textarea-field"
            ></textarea>
          </div>
          <div className="form-group">
            <label>Hình ảnh:</label>
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              required
              className="file-input"
            />
          </div>
          <div className="form-group">
            <label>Danh mục:</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="input-field"
            >
              <option value="" disabled>Chọn danh mục</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
          <h3>Công thức</h3>
          <button type="button" onClick={addIngredient} className="add-ingredient-button">Thêm nguyên liệu</button>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="ingredient-group">
              <select
                value={ingredient.id}
                onChange={(e) => handleIngredientChange(index, e.target.value)}
                required
                className="ingredient-select"
              >
                <option value="" disabled>Chọn nguyên liệu</option>
                {availableIngredients.map(ing => (
                  <option key={ing._id} value={ing._id}>{ing.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Số lượng"
                value={ingredient.quantity}
                onChange={(e) => {
                  const quantity = e.target.value;
                  if (!isNaN(quantity) && quantity > 0) { // Ràng buộc số lượng không âm và không nhập chữ
                    const newIngredients = [...ingredients];
                    newIngredients[index].quantity = quantity;
                    setIngredients(newIngredients);
                  }
                }}
                required
                className="ingredient-quantity"
              />
              <span>{availableIngredients.find(ing => ing._id === ingredient.id)?.unit}</span> 
              <button type="button" onClick={() => removeIngredient(index)} className="remove-ingredient-button">
                Xóa
              </button>
            </div>
          ))}
          <button type="submit" className="submit-button">Thêm sản phẩm</button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
