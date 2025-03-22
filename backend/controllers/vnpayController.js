const qs = require("qs");
const crypto = require("crypto");

const vnp_TmnCode = process.env.VNP_TMNCODE;
const vnp_HashSecret = process.env.VNP_HASHSECRET;
const vnp_Url = process.env.VNP_URL;
const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

const createPayment = (req, res) => {
    console.log("Debug: Đã vào createPayment");
    console.log("VNP_TMNCODE:", vnp_TmnCode);
    console.log("VNP_HASHSECRET:", vnp_HashSecret ? "✅ Đã có giá trị" : "❌ Bị undefined");
    console.log("VNP_URL:", vnp_Url);
    console.log("VNP_RETURN_URL:", vnp_ReturnUrl);
    console.log("🔹 Nhận request tạo thanh toán:", req.body);

    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
        console.error("❌ Lỗi: Thiếu amount hoặc orderId!");
        return res.status(400).json({ error: "Thiếu amount hoặc orderId" });
    }

    const date = new Date();
    const createDate = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, "0") +
        date.getDate().toString().padStart(2, "0") +
        date.getHours().toString().padStart(2, "0") +
        date.getMinutes().toString().padStart(2, "0") +
        date.getSeconds().toString().padStart(2, "0");

    const ipAddr = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "127.0.0.1";
    const vnp_IpAddr = ipAddr.includes(",") ? ipAddr.split(",")[0].trim() : ipAddr;

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
        "vnp_CreateDate": createDate,
        "vnp_IpAddr": vnp_IpAddr
    };

    // ✅ Xóa các tham số không cần thiết trước khi ký
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // ✅ Sắp xếp tham số theo thứ tự a-z
    const sortedParams = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});

    // ✅ Tạo query string để ký
    const queryString = qs.stringify(sortedParams, { encode: false });
    console.log("🔹 Query string để ký:", queryString);

    // ✅ Tạo chữ ký SHA512
    const secureHash = crypto.createHmac("sha512", vnp_HashSecret)
        .update(queryString)
        .digest("hex");

    console.log("🔹 Chữ ký SHA512 tạo ra:", secureHash);

    // ✅ Thêm chữ ký vào query params
    vnp_Params["vnp_SecureHash"] = secureHash;

    // ✅ Tạo URL thanh toán
    const paymentUrl = `${vnp_Url}?${qs.stringify(vnp_Params, { encode: false })}`;
    console.log("✅ URL Thanh toán VNPay:", paymentUrl);

    res.json({ paymentUrl });
};


const returnPayment = (req, res) => {
    let vnp_Params = { ...req.query };
    console.log("🔹 Dữ liệu nhận từ VNPay:", vnp_Params);

    const secureHash = vnp_Params["vnp_SecureHash"];  // Lưu chữ ký VNPay gửi về

    // ✅ Xóa các tham số không cần thiết trước khi ký lại
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // ✅ Kiểm tra giá trị `vnp_Amount`
    console.log("🔹 Giá trị vnp_Amount nhận được:", vnp_Params["vnp_Amount"]);

    // ✅ Sắp xếp tham số theo thứ tự a-z
    const sortedParams = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});

    // ✅ Tạo chuỗi query string để ký
    const signData = qs.stringify(sortedParams, { encode: false });
    console.log("🔹 Query string trước khi ký lại:", signData);

    // ✅ Tạo chữ ký mới
    const signed = crypto.createHmac("sha512", vnp_HashSecret)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");

    console.log("🔹 SecureHash nhận được:", secureHash);
    console.log("🔹 SecureHash tự tạo:", signed);

    // ✅ So sánh chữ ký để kiểm tra tính hợp lệ
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
