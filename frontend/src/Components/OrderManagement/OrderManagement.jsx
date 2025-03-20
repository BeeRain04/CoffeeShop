import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AiOutlineEye, AiOutlineDelete, AiOutlineReload, AiOutlineSearch } from 'react-icons/ai';
import SidebarNav from '../SidebarNav/SidebarNav';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import ToastNotification from '../ToastNotification/ToastNotification';
import './OrderManagement.css';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [orderIdToDelete, setOrderIdToDelete] = useState(null);
    const [toast, setToast] = useState({ message: '', type: '', visible: false });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const location = useLocation();

    const fetchOrders = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8000/v1/order');
            const data = await response.json();
            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                setOrders([]);
                console.error('Invalid order data format:', data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            showToast('Lỗi khi tải dữ liệu.', 'error');
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        if (location.state?.message) {
            showToast(location.state.message, 'success');
        }
    }, [location.state, fetchOrders]);

    const showToast = (message, type) => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
    };

    const handleDelete = async () => {
        if (orderIdToDelete) {
            try {
                const response = await fetch(`http://localhost:8000/v1/order/${orderIdToDelete}`, { method: 'DELETE' });
                if (response.ok) {
                    showToast('Xóa đơn hàng thành công!', 'success');
                    fetchOrders();
                } else {
                    showToast('Lỗi khi xóa đơn hàng.', 'error');
                }
            } catch (error) {
                showToast('Lỗi khi xóa đơn hàng.', 'error');
            } finally {
                setShowConfirmDialog(false);
                setOrderIdToDelete(null);
            }
        }
    };

    const filteredOrders = orders.filter((order) =>
        order._id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    return (
        <div className="order-management-container">
            <SidebarNav />
            <div className="order-content">
                <h1 className="order-title">Quản Lý Đơn Hàng</h1>
                <div className="order-actions">
                    <div className="search-box">
                        <AiOutlineSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm Order ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="refresh-button" onClick={fetchOrders}>
                        <AiOutlineReload size={20} /> Làm mới
                    </button>
                </div>

                <table className="order-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Order ID</th>
                            <th>Khách Hàng</th>
                            <th>Tổng Tiền (VND)</th>
                            <th>Trạng Thái</th>
                            <th>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((order, index) => (
                            <tr key={order._id}>
                                <td>{index + 1 + (currentPage - 1) * itemsPerPage}</td>
                                <td>{order._id}</td>
                                <td>{order.customerId?.name || 'N/A'}</td>
                                <td>{order.totalAmount.toLocaleString()}</td>
                                <td>{order.status}</td>
                                <td>
                                    <Link to={`/order/detail/${order._id}`} className="icon-button">
                                        <AiOutlineEye size={20} title="Xem Chi Tiết" />
                                    </Link>
                                    <button onClick={() => {
                                        setShowConfirmDialog(true);
                                        setOrderIdToDelete(order._id);
                                    }} className="icon-button delete-button">
                                        <AiOutlineDelete size={20} title="Xóa" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pagination">
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button key={index + 1} className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(index + 1)}>
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>

            {showConfirmDialog && (
                <ConfirmDialog message="Bạn có chắc muốn xóa đơn hàng này?" onConfirm={handleDelete} onCancel={() => setShowConfirmDialog(false)} />
            )}

            {toast.visible && (
                <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, visible: false }))} />
            )}
        </div>
    );
};

export default OrderManagement;
