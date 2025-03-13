const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');
const categoryRoute = require('./routes/category');
const inventoryRoute = require('./routes/inventory');
const productRoute = require('./routes/product');
const orderRoute = require('./routes/order');
const customersRoute = require('./routes/customer');
const reportRoutes = require('./routes/report');
const paymentRoute = require('./routes/vnpayRoutes');

dotenv.config();
const app = express();
const uri = process.env.MONGO_URI;
const PORT = process.env.PORT;

async function connectToDB() {
    try {
        await mongoose.connect(uri); 
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}

connectToDB();

app.use(cors({
    origin: ['http://localhost:3000', 'https://coffeeshop-com.onrender.com'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json());

app.use("/v1/auth", authRoute);
app.use("/v1/user", userRoute);
app.use("/v1/categories", categoryRoute); 
app.use("/v1/inventory", inventoryRoute);
app.use("/v1/products", productRoute);
app.use("/v1/order", orderRoute);
app.use("/v1/customer", customersRoute);
app.use("/v1/report", reportRoutes);
app.use("/v1/payment", paymentRoute);

// ✅ Thêm route cho "/"
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
    console.error('Error details:', err); 
    res.status(err.status || 500).send({
        message: err.message || 'Something broke!',
        error: process.env.NODE_ENV === 'development' ? err : {} 
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
