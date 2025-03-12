const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


let refreshTokens = [];
const authController = {
    registerUser: async (req, res) => {
        const { username, email, password } = req.body;
    
        // Tạo biến lưu lỗi
        const errors = {};
    
        // Validation thủ công
        if (!username || username.trim() === "") {
            errors.username = "Tên đăng nhập không được để trống.";
        } else if (username.length < 6) {
            errors.username = "Tên đăng nhập phải có ít nhất 6 ký tự.";
        } else if (username.length > 20) {
            errors.username = "Tên đăng nhập không được vượt quá 20 ký tự.";
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.username = "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới.";
        }
    
        if (!email || email.trim() === "") {
            errors.email = "Email không được để trống.";
        } else if (!/^[^\s@]+@gmail\.com$/.test(email)) {
            errors.email = "Email phải đúng định dạng @gmail.com.";
        }
    
        if (!password || password.trim() === "") {
            errors.password = "Mật khẩu không được để trống.";
        } else if (password.length < 6) {
            errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
        } else if (password.length > 100) {
            errors.password = "Mật khẩu không được vượt quá 100 ký tự.";
        } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)) {
            errors.password = "Mật khẩu phải bao gồm ít nhất một chữ cái, một số, và một ký tự đặc biệt.";
        }
    
        // Nếu có lỗi, trả về lỗi
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }
    
        try {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(password, salt);
    
            const newUser = await new User({
                username: username,
                email: email,
                password: hashed,
            });
    
            const user = await newUser.save();
            res.status(201).json(user);
        } catch (err) {
            res.status(500).json(err);
        }
    },
    //generate access token
    generateAccessToken: (user) => {
        return jwt.sign({
            id: user.id,
            isAdmin: user.isAdmin
        },
            process.env.JWT_SECRET,
            { expiresIn: "30s" }
        );
    },
    //generate refresh token
    generateRefreshToken: (user) => {
        return jwt.sign({
            id: user.id,
            isAdmin: user.isAdmin
        },
            process.env.JWT_SECRET,
            { expiresIn: "365d" }
        );
    },
    //Login
    loginUser: async (req, res) => {
        const { username, password } = req.body;
    
        // Tạo biến lưu lỗi
        const errors = {};
    
        // Validation thủ công
        if (!username || username.trim() === "") {
            errors.username = "Tên đăng nhập không được để trống.";
        }
    
        if (!password || password.trim() === "") {
            errors.password = "Mật khẩu không được để trống.";
        }
    
        // Nếu có lỗi, trả về lỗi
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }
    
        try {
            // Kiểm tra user tồn tại
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(404).json({ error: "Sai tên đăng nhập." });
            }
    
            // Kiểm tra mật khẩu hợp lệ
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(404).json({ error: "Sai mật khẩu." });
            }
    
            // Nếu user và mật khẩu hợp lệ, tạo token
            if (user && validPassword) {
                const accessToken = authController.generateAccessToken(user);
                const refreshToken = authController.generateRefreshToken(user);
                refreshTokens.push(refreshToken);
    
                // Lưu refreshToken trong cookie
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    path: "/",
                    sameSite: "strict",
                    secure: false, // Đổi thành true nếu chạy trên HTTPS
                });
    
                // Loại bỏ mật khẩu khỏi kết quả trả về
                const { password, ...others } = user._doc;
                res.status(200).json({ ...others, accessToken });
            }
        } catch (err) {
            res.status(500).json({ error: "Lỗi máy chủ, vui lòng thử lại sau." });
        }
    },
    requestRefreshToken: async (req, res) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json("You're not auth");
        if (!refreshTokens.includes(refreshToken)) {
            return res.status(403).json("RefreshToken is not valid");
        }
        jwt.verify(refreshToken, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.log(err);
            }
            refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
            const newAccessToken = authController.generateAccessToken(user);
            const newRefreshToken = authController.generateRefreshToken(user);
            refreshTokens.push(newRefreshToken);
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                path: "/",
                sameSite: "strict",
                secure: false
            });
            res.status(200).json({ accessToken: newAccessToken });
        });
    },
    userLogout: async (req, res) => {
        res.clearCookie("refreshToken");
        refreshTokens = refreshTokens.filter(token => token !== req.cookies.refreshToken);
        res.status(200).json("Đăng xuất thành công");
    }
};
module.exports = authController;