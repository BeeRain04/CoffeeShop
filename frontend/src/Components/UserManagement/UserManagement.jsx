import { useEffect, useState } from "react";
import "./userManagement.css";
import { deleteUser, getAllUsers } from "../../redux/apiRequest";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../../redux/authSlice";
import { createAxios } from "../../createInstance";
import { FaTrash } from 'react-icons/fa';
import SidebarNav from "../SidebarNav/SidebarNav";

const UserManagement = () => {
  const user = useSelector((state) => state.auth.login?.currentUser);
  const userList = useSelector((state) => state.users.users?.allUsers);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  let axiosJWT = createAxios(user, dispatch, loginSuccess);
  const [deleteMessage, setDeleteMessage] = useState("");

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này không?")) {
      try {
        const response = await deleteUser(user?.accessToken, dispatch, id, axiosJWT);
        console.log("Delete response:", response);
        if (response && response.success) {
          setDeleteMessage("Người dùng đã được xóa thành công");
          getAllUsers(user?.accessToken, dispatch, axiosJWT);
          setTimeout(() => setDeleteMessage(""), 3000);
        } else {
          setDeleteMessage("Xóa người dùng thành công");
        }
      } catch (error) {
        console.error("Không thể xóa người dùng:", error);
        setDeleteMessage("Có lỗi xảy ra khi xóa người dùng");
      }
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user?.accessToken) {
      getAllUsers(user?.accessToken, dispatch, axiosJWT);
    }
  }, [user, dispatch, navigate, axiosJWT]);

  return (
    <div className="container_div">
      <SidebarNav />
      <main className="user-management-container">
        <h1 className="user-management-title">Quản Lý Người Dùng</h1>
        <div className="user-management-role">
          {`Vai trò của bạn: ${user?.isAdmin ? 'Quản trị viên' : 'Người dùng'}`}
        </div>
        {deleteMessage && <div className="delete-message">{deleteMessage}</div>}
        <table className="user-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {userList?.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.isAdmin ? 'Quản trị viên' : 'Người dùng'}</td>
                <td>
                  <button
                    className="delete-user"
                    onClick={() => handleDelete(user._id)}
                  >
                    <FaTrash /> Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default UserManagement;
