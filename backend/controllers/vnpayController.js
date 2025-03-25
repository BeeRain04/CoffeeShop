const qs = require("qs");
const crypto = require("crypto");

const vnp_TmnCode = process.env.VNP_TMNCODE;
const vnp_HashSecret = process.env.VNP_HASHSECRET;
const vnp_Url = process.env.VNP_URL;
const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

// Hàm lấy thời gian (không dùng API bên ngoài)
const getServerTime = () => {
    const now = new Date();
    // Điều chỉnh múi giờ sang UTC+7 (Asia/Ho_Chi_Minh)
    const vnDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    return vnDate;
};

const createPayment = async (req, res) => {
    console.log("Debug: Đã vào createPayment");
    console.log("VNP_TMNCODE:", vnp_TmnCode);
    console.log("VNP_HASHSECRET:", vnp_HashSecret ? "✅ Đã có giá trị" : "❌ Bị undefined");
    console.log("🔹 vnp_HashSecret:", vnp_HashSecret);
    console.log("VNP_URL:", vnp_Url);
    console.log("VNP_RETURN_URL:", vnp_ReturnUrl);
    console.log("🔹 Nhận request tạo thanh toán:", req.body);

    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
        console.error("❌ Lỗi: Thiếu amount hoặc orderId!");
        return res.status(400).json({ error: "Thiếu amount hoặc orderId" });
    }

    // Lấy thời gian
    const date = getServerTime();
    console.log("🔹 Server time (UTC):", date.toISOString());
    console.log("🔹 VN time (UTC+7):", date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }));

    // Thời gian UTC để tính chữ ký
    const createDateForHash = date.getUTCFullYear().toString() +
        (date.getUTCMonth() + 1).toString().padStart(2, "0") +
        date.getUTCDate().toString().padStart(2, "0") +
        date.getUTCHours().toString().padStart(2, "0") +
        date.getUTCMinutes().toString().padStart(2, "0") +
        date.getUTCSeconds().toString().padStart(2, "0");

    const expireDateForHash = new Date(date.getTime() + 15 * 60 * 1000);
    const vnp_ExpireDateForHash = expireDateForHash.getUTCFullYear().toString() +
        (expireDateForHash.getUTCMonth() + 1).toString().padStart(2, "0") +
        expireDateForHash.getUTCDate().toString().padStart(2, "0") +
        expireDateForHash.getUTCHours().toString().padStart(2, "0") +
        expireDateForHash.getUTCMinutes().toString().padStart(2, "0") +
        expireDateForHash.getUTCSeconds().toString().padStart(2, "0");

    // Thời gian giờ Việt Nam (UTC+7) để gửi trong vnp_Params
    const vnDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const createDate = vnDate.getFullYear().toString() +
        (vnDate.getMonth() + 1).toString().padStart(2, "0") +
        vnDate.getDate().toString().padStart(2, "0") +
        vnDate.getHours().toString().padStart(2, "0") +
        vnDate.getMinutes().toString().padStart(2, "0") +
        vnDate.getSeconds().toString().padStart(2, "0");

    const expireDate = new Date(vnDate.getTime() + 15 * 60 * 1000);
    const vnp_ExpireDate = expireDate.getFullYear().toString() +
        (expireDate.getMonth() + 1).toString().padStart(2, "0") +
        expireDate.getDate().toString().padStart(2, "0") +
        expireDate.getHours().toString().padStart(2, "0") +
        expireDate.getMinutes().toString().padStart(2, "0") +
        expireDate.getSeconds().toString().padStart(2, "0");

    console.log("🔹 vnp_CreateDate (UTC, for hash):", createDateForHash);
    console.log("🔹 vnp_ExpireDate (UTC, for hash):", vnp_ExpireDateForHash);
    console.log("🔹 vnp_CreateDate (VN time, for params):", createDate);
    console.log("🔹 vnp_ExpireDate (VN time, for params):", vnp_ExpireDate);

    const ipAddr = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "127.0.0.1";
    const vnp_IpAddr = ipAddr.includes(",") ? ipAddr.split(",")[0].trim() : ipAddr;
    console.log("🔹 IP Address:", vnp_IpAddr);

    let vnp_Params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": vnp_TmnCode,
        "vnp_Locale": "vn",
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": orderId,
        "vnp_OrderInfo": `Thanh toan don hang ${orderId}`,
        "vnp_OrderType": "billpayment",
        "vnp_Amount": amount * 100,
        "vnp_ReturnUrl": vnp_ReturnUrl,
        "vnp_CreateDate": createDate, // Dùng giờ Việt Nam
        "vnp_ExpireDate": vnp_ExpireDate, // Dùng giờ Việt Nam
        "vnp_IpAddr": vnp_IpAddr
    };

    console.log("🔹 vnp_Params trước khi ký:", vnp_Params);

    // Tạo một bản sao của vnp_Params để tính chữ ký, dùng thời gian UTC
    let vnp_ParamsForHash = { ...vnp_Params };
    vnp_ParamsForHash["vnp_CreateDate"] = createDateForHash; // Dùng UTC để tính chữ ký
    vnp_ParamsForHash["vnp_ExpireDate"] = vnp_ExpireDateForHash; // Dùng UTC để tính chữ ký

    // Xóa các tham số không cần thiết trước khi ký
    delete vnp_ParamsForHash["vnp_SecureHash"];
    delete vnp_ParamsForHash["vnp_SecureHashType"];

    // Sắp xếp tham số theo thứ tự a-z
    const sortedParams = Object.keys(vnp_ParamsForHash).sort().reduce((acc, key) => {
        acc[key] = vnp_ParamsForHash[key];
        return acc;
    }, {});

    console.log("🔹 sortedParams:", sortedParams);

    // Tạo query string để ký, mã hóa URL các giá trị
    const queryString = qs.stringify(sortedParams, { encode: true });
    console.log("🔹 Query string để ký (đã mã hóa URL, dùng UTC):", queryString);

    // Tạo chữ ký SHA512
    const secureHash = crypto.createHmac("sha512", vnp_HashSecret)
        .update(queryString)
        .digest("hex");

    console.log("🔹 Chữ ký SHA512 tạo ra:", secureHash);

    // Thêm chữ ký vào query params
    vnp_Params["vnp_SecureHash"] = secureHash;

    // Tạo URL thanh toán, mã hóa URL các tham số
    const paymentUrl = `${vnp_Url}?${qs.stringify(vnp_Params, { encode: true })}`;
    console.log("✅ URL Thanh toán VNPay:", paymentUrl);

    res.json({ paymentUrl });
};

const returnPayment = (req, res) => {
    let vnp_Params = { ...req.query };
    console.log("🔹 Dữ liệu nhận từ VNPay:", vnp_Params);

    const secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    console.log("🔹 Giá trị vnp_Amount nhận được:", vnp_Params["vnp_Amount"]);

    const sortedParams = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});

    const signData = qs.stringify(sortedParams, { encode: true });
    console.log("🔹 Query string trước khi ký lại (đã mã hóa URL):", signData);

    const signed = crypto.createHmac("sha512", vnp_HashSecret)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");

    console.log("🔹 SecureHash nhận được:", secureHash);
    console.log("🔹 SecureHash tự tạo:", signed);

    if (secureHash === signed) {
        if (vnp_Params["vnp_ResponseCode"] === "00") {
            return res.json({ status: "success", message: "Thanh toán thành công!" });
        } else {
            return res.json({ status: "failed", message: "Thanh toán thất bại!" });
        }
    } else {
        return res.json({
            status: "error",
            message: "Chữ ký không hợp lệ!",
            receivedHash: secureHash,
            generatedHash: signed
        });
    }
};

module.exports = { createPayment, returnPayment };