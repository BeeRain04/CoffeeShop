const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Inventory = require("../models/Inventory"); // Thêm mô hình Inventory

// Hàm tự sinh OrderId theo định dạng DH001, DH002, ...
async function generateOrderId() {
    const lastOrder = await Order.findOne().sort({ createdAt: -1 });
    if (!lastOrder || !lastOrder.orderId) {
        return "DH001";
    }
    const lastOrderId = lastOrder.orderId;
    const numericPart = parseInt(lastOrderId.substring(2), 10) + 1;
    const newOrderId = `DH${String(numericPart).padStart(3, "0")}`;
    return newOrderId;
}

// 1. Tạo đơn hàng
router.post("/", async (req, res) => {
    try {
        const { customerId, items, paymentMethod } = req.body;  // Lấy paymentMethod từ body

        // Kiểm tra phương thức thanh toán hợp lệ
        const validPaymentMethods = ['Tiền mặt', 'Thẻ tín dụng', 'Ví điện tử', 'Chuyển khoản'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
        }

        // Chuyển đổi customerId thành ObjectId
        const customerObjectId = new mongoose.Types.ObjectId(customerId);

        // Kiểm tra khách hàng có tồn tại
        const customer = await Customer.findById(customerObjectId);
        if (!customer) {
            return res.status(404).json({ message: "Khách hàng không tồn tại" });
        }

        // Tính tổng tiền và chuyển đổi productId thành ObjectId
        let totalAmount = 0;
        const updatedItems = await Promise.all(
            items.map(async (item) => {
                const productObjectId = new mongoose.Types.ObjectId(item.productId);
                const product = await Product.findById(productObjectId);
                if (!product) {
                    throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại`);
                }
                const itemTotal = product.price * item.quantity;
                totalAmount += itemTotal;
                return {
                    productId: productObjectId,
                    quantity: item.quantity,
                    ingredients: product.ingredients, // Lấy thông tin nguyên liệu từ sản phẩm
                };
            })
        );

        // Tự sinh OrderId
        const orderId = await generateOrderId();

        // Tạo đơn hàng mới và thêm phương thức thanh toán
        const newOrder = new Order({
            orderId,
            customerId: customerObjectId,
            items: updatedItems,
            totalAmount,
            paymentMethod,  // Thêm phương thức thanh toán vào đơn hàng
        });

        // Cập nhật kho sau khi tạo đơn hàng
        for (let item of updatedItems) {
            for (let ingredient of item.ingredients) {
                const inventory = await Inventory.findById(ingredient.inventoryId);
                if (!inventory) {
                    return res.status(404).json({
                        message: `Nguyên liệu ${ingredient.inventoryId} không tồn tại trong kho`,
                    });
                }

                // Kiểm tra tồn kho
                if (inventory.stockQuantity < ingredient.quantity * item.quantity) {
                    return res.status(400).json({
                        message: `Kho không đủ nguyên liệu ${inventory.name} để sản xuất sản phẩm`,
                    });
                }

                // Trừ nguyên liệu trong kho
                inventory.stockQuantity -= ingredient.quantity * item.quantity;
                await inventory.save();
            }
        }

        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 2. Lấy danh sách tất cả đơn hàng
router.get("/", async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("customerId", "name")
            .populate("items.productId", "name price");

        const formattedOrders = orders.map(order => ({
            orderId: order.orderId,
            customer: order.customerId.name,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentMethod: order.paymentMethod,
            isPaid: order.isPaid ? "Đã thanh toán" : "Chưa thanh toán", // Hiển thị trạng thái thanh toán
            items: order.items.map(item => ({
                product: item.productId.name,
                quantity: item.quantity,
                price: item.productId.price
            }))
        }));

        res.status(200).json(formattedOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lấy chi tiết đơn hàng theo orderId
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // Tìm kiếm đơn hàng bằng `orderId` thay vì `_id`
        const order = await Order.findOne({ orderId: id })
            .populate("customerId", "name")
            .populate("items.productId", "name price");

        if (!order) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Sửa items của đơn hàng theo `orderId`
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { items, paymentMethod } = req.body;

        // Kiểm tra phương thức thanh toán hợp lệ
        const validPaymentMethods = ['Tiền mặt', 'Thẻ tín dụng', 'Ví điện tử', 'Chuyển khoản'];
        if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
        }

        // Tìm kiếm đơn hàng
        const existingOrder = await Order.findOne({ orderId: id });
        if (!existingOrder) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }

        // Tính lại tổng tiền và cập nhật items
        let totalAmount = 0;
        const updatedItems = await Promise.all(
            items.map(async (item) => {
                const productObjectId = new mongoose.Types.ObjectId(item.productId);
                const product = await Product.findById(productObjectId);
                if (!product) {
                    throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại`);
                }
                const itemTotal = product.price * item.quantity;
                totalAmount += itemTotal;
                return {
                    productId: productObjectId,
                    quantity: item.quantity,
                };
            })
        );

        // Cập nhật đơn hàng với các thông tin mới
        existingOrder.items = updatedItems;
        existingOrder.totalAmount = totalAmount;

        // Cập nhật phương thức thanh toán nếu có
        if (paymentMethod) {
            existingOrder.paymentMethod = paymentMethod;
        }

        const updatedOrder = await existingOrder.save();
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 4. Cập nhật trạng thái đơn hàng
router.put("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Kiểm tra trạng thái hợp lệ
        const validStatuses = ['Chưa xử lý', 'Đang xử lý', 'Đã giao hàng', 'Đã hủy'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ" });
        }

        // Tìm và cập nhật trạng thái đơn hàng
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: id },  // Tìm theo orderId
            { status },
            { new: true }  // Trả về đối tượng đã cập nhật
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: error.message });
    }
});

// 5. Xóa đơn hàng theo orderID
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        // Tìm và xóa đơn hàng dựa trên `orderId`
        const deletedOrder = await Order.findOneAndDelete({ orderId: id });

        if (!deletedOrder) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }

        res.status(200).json({ message: `Đã xóa đơn hàng ${id} thành công` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.put("/:id/pay", async (req, res) => {
    try {
        const { id } = req.params;

        // Tìm và cập nhật trạng thái thanh toán
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: id },
            { status: "Đã thanh toán", isPaid: true },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }

        res.status(200).json({
            message: "Đơn hàng đã được thanh toán thành công",
            order: updatedOrder
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
