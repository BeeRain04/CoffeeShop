import "./App.css";
import UserManagement from "./Components/UserManagement/UserManagement";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./Components/Login/Login";
import Register from "./Components/Register/Register";
import NavBar from "./Components/NavBar/NavBar";
import Dashboard from "./Components/Dashboard/Dashboard";
import ProductManagement from "./Components/ProductManagement/ProductManagement";
import AddProduct from "./Components/ProductManagement/AddProduct";
import EditProduct from "./Components/ProductManagement/EditProduct";
import DetailProduct from "./Components/ProductManagement/DetailProduct";
import CategoryManagement from "./Components/CategoryManagement/CategoryManagement";
import AddCategory from "./Components/CategoryManagement/AddCategory";
import EditCategory from "./Components/CategoryManagement/EditCategory";
import InventoryManagement from "./Components/InventoryManagement/InventoryManagement";
import AddInventory from "./Components/InventoryManagement/AddInventory";
import EditInventory from "./Components/InventoryManagement/EditInventory";
import DetailInventory from "./Components/InventoryManagement/DetailInventory";
import OrderManagement from "./Components/OrderManagement/OrderManagement";
import OrderDetail from "./Components/OrderManagement/OrderDetail";
import Home from "./Components/Home/home";
import ReportManagement from "./Components/ReportManagement/ReportManagement";
import RevenueReport from './Components/RevenueReport/RevenueReport';
import InventoryReport from './Components/InventoryReport/InventoryReport';
import BestSellingReport from './Components/BestSellingReport/BestSellingReport';
import ProductDetail from "./Components/ProductDetail/ProductDetail";
import Cart from "./Components/Cart/CartPage";
import Checkout from "./Components/Checkout/Checkout";
import PaymentResult from "./Components/Checkout/PaymentResult";
import { HelmetProvider } from "react-helmet-async";



function App() {
  return (
    <HelmetProvider>
      <Router>
      <NavBar />
      <div className="App">
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Route Quản lý người dùng */}
          <Route path="/usermanagement" element={<UserManagement />} />
          
          {/* Route Quản lý đăng nhập, đăng ký */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Route Quản lý sản phẩm */}
          <Route path="/product" element={<ProductManagement />} />
          <Route path="/product/add" element={<AddProduct />} />
          <Route path="/product/edit/:id" element={<EditProduct />} />
          <Route path="/product/detail/:id" element={<DetailProduct />} />

          {/* Route Quản lý đơn hàng */}
          <Route path="/order" element={<OrderManagement />} />
          <Route path="/order/detail/:id" element={<OrderDetail />} />

          {/* Route Quản lý danh mục */}
          <Route path="/category" element={<CategoryManagement />} />
          <Route path="/category/add" element={<AddCategory />} />
          <Route path="/category/edit/:id" element={<EditCategory />} />

          {/* Route Quản lý kho */}
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/inventory/add" element={<AddInventory />} />
          <Route path="/inventory/edit/:id" element={<EditInventory />} />
          <Route path="/inventory/detail/:id" element={<DetailInventory />} />

          {/* Route Quản lý báo cáo */}
          <Route path="/report" element={<ReportManagement />} />    
          <Route path="/revenue" element={<RevenueReport />} />          
          <Route path="/inventoryreport" element={<InventoryReport />} />          
          <Route path="/best-selling" element={<BestSellingReport />} />    

          {/*Router của bên client*/}      
          <Route path="/product/:productId" element={<ProductDetail />} />
          {/*Route của cart*/}
          <Route path="/cart" element={<Cart/>}/>
          {/*Route của thanh toán*/}
          <Route path="/checkout" element={<Checkout/>}/>
          <Route path="/paymentresult" element={<PaymentResult/>}/>
        </Routes>
      </div>
    </Router>
    </HelmetProvider>
  );
}

export default App;
