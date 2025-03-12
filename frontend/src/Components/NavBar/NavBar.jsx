import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logOut } from "../../redux/apiRequest.js";
import { createAxios } from "../../createInstance";
import { logOutSuccess } from "../../redux/authSlice";
import { FaCoffee, FaShoppingCart } from 'react-icons/fa';
import { clearCart } from "../../redux/cartSlice";
import "./navbar.css";

const NavBar = () => {
  const user = useSelector((state) => state.auth.login.currentUser);
  const totalQuantity = useSelector((state) => state.cart.totalQuantity) ?? 0;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const accessToken = user?.accessToken;
  const id = user?._id;
  let axiosJWT = createAxios(user, dispatch, logOutSuccess);

  const handleLogout = () => {
    if (!user) return; // ✅ Ngăn lỗi nếu user chưa đăng nhập
    logOut(dispatch, id, navigate, accessToken, axiosJWT);
    dispatch(clearCart());
    navigate("/login");
  };

  return (
    <nav className="navbar-container">
      <div className="navbar-left">
        <Link to="/home" className="navbar-logo">
          <FaCoffee className="coffee-icon" />
          <span>Coffee Shop</span>
        </Link>
        {user && <p className="navbar-user">Hi, <span>{user.username}</span></p>}
      </div>
      <div className="navbar-right">
        <div className="navbar-cart">
          <Link to="/cart">
            <FaShoppingCart className="cart-icon" />
            {totalQuantity > 0 && <span className="cart-count">{totalQuantity}</span>}
          </Link>
        </div>
        {user ? (
          <button className="navbar-logout" onClick={handleLogout}>Log out</button>
        ) : (
          <>
            <Link to="/login" className="navbar-login">Đăng nhập</Link>
            <Link to="/register" className="navbar-register">Đăng ký</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
