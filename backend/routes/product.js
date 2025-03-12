const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');

const router = express.Router();

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: 'dem1hcy19',
    api_key: '183398327458618',
    api_secret: 'TJsV-ojOMo4Lyzk2fhD4BsQJn6I',
});

// Cấu hình Multer với Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'products',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});
const upload = multer({ storage });

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Hàm kiểm tra Category và Inventory tồn tại
const checkCategoryExists = async (categoryId) =>
    isValidObjectId(categoryId) && (await Category.exists({ _id: categoryId }));

const checkInventoryExists = async (inventoryId) =>
    isValidObjectId(inventoryId) && (await Inventory.exists({ _id: inventoryId }));

// Hàm parse JSON an toàn cho ingredients
const parseIngredients = (ingredients) => {
    try {
        return typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
    } catch (error) {
        console.error('Invalid ingredients format:', error);
        return [];
    }
};

// Tạo sản phẩm mới
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, price, description, categoryId, ingredients } = req.body; // Thêm description
        const parsedIngredients = parseIngredients(ingredients);

        if (!(await checkCategoryExists(categoryId))) {
            return res.status(400).json({ error: `CategoryId ${categoryId} không tồn tại` });
        }

        for (const ingredient of parsedIngredients) {
            if (!(await checkInventoryExists(ingredient.inventoryId))) {
                return res.status(400).json({ error: `InventoryId ${ingredient.inventoryId} không tồn tại` });
            }
        }

        const latestProduct = await Product.findOne({}, {}, { sort: { productId: -1 } });
        const newProductId = latestProduct
            ? `SP${(parseInt(latestProduct.productId.slice(2)) + 1).toString().padStart(3, '0')}`
            : 'SP001';

        const product = new Product({
            productId: newProductId,
            name,
            price,
            description, // Lưu description vào sản phẩm
            categoryId,
            ingredients: parsedIngredients,
            image: req.file?.path || '',
        });

        await product.save();
        res.status(201).json({ message: 'Product created successfully!', product });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Lấy danh sách sản phẩm
router.get('/', async (req, res) => {
    try {
        const products = await Product.find()
            .populate('categoryId', 'name')
            .populate('ingredients.inventoryId', 'name unit');

        const response = products.map((product) => ({
            ...product.toObject(),
            ingredients: product.ingredients.map((ingredient) => ({
                name: ingredient.inventoryId?.name || 'Không xác định',
                unit: ingredient.inventoryId?.unit || 'Không xác định',
                quantity: ingredient.quantity,
            })),
        }));

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Lấy chi tiết sản phẩm theo productId
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Received Product ID:', id);

        // Kiểm tra nếu id hợp lệ là ObjectId hay không
        const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
        const query = isValidObjectId ? { _id: id } : { productId: id };

        const product = await Product.findOne(query)
            .populate('categoryId', 'name')
            .populate('ingredients.inventoryId', 'name unit');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const response = {
            ...product.toObject(),
            ingredients: product.ingredients.map((ingredient) => ({
                name: ingredient.inventoryId?.name || 'Không xác định',
                unit: ingredient.inventoryId?.unit || 'Không xác định',
                quantity: ingredient.quantity,
            })),
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Cập nhật sản phẩm
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, price, description, categoryId, ingredients } = req.body; // Thêm description
        const parsedIngredients = parseIngredients(ingredients);

        const product = await Product.findOne({ productId: req.params.id });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (categoryId && !(await checkCategoryExists(categoryId))) {
            return res.status(400).json({ error: `CategoryId ${categoryId} không tồn tại` });
        }

        for (const ingredient of parsedIngredients) {
            if (!(await checkInventoryExists(ingredient.inventoryId))) {
                return res.status(400).json({ error: `InventoryId ${ingredient.inventoryId} không tồn tại` });
            }
        }

        if (req.file) {
            const publicId = product.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`products/${publicId}`);
            product.image = req.file.path;
        }

        // Cập nhật các trường
        product.name = name;
        product.price = price;
        product.description = description; // Cập nhật description
        product.categoryId = categoryId;
        product.ingredients = parsedIngredients;

        await product.save();
        res.status(200).json({ message: 'Product updated successfully!', product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Xóa sản phẩm
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ productId: req.params.id });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.image) {
            const publicId = product.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`products/${publicId}`);
        }

        res.status(200).json({ message: 'Product deleted successfully!' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
