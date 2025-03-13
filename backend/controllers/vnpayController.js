const qs = require("qs");
const crypto = require("crypto");

const vnp_TmnCode = process.env.VNP_TMNCODE;  // Lấy từ VNPay
const vnp_HashSecret = process.env.VNP_HASHSECRET; // Lấy từ VNPay
const vnp_Url = process.env.VNP_URL; // URL sandbox
const vnp_ReturnUrl = process.env.VNP_RETURN_URL; // URL trả về sau thanh toán

const createPayment = (req, res) => {
    console.log("🔹 Nhận request tạo thanh toán:", req.body);
    const { amount, orderId } = req.body; // Lấy số tiền và mã đơn hàng từ request

    const date = new Date();
    const createDate = date.getFullYear() + 
        ((date.getMonth() + 1).toString().padStart(2, "0")) + 
        (date.getDate().toString().padStart(2, "0")) + 
        (date.getHours().toString().padStart(2, "0")) + 
        (date.getMinutes().toString().padStart(2, "0")) + 
        (date.getSeconds().toString().padStart(2, "0"));

    let vnp_Params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": vnp_TmnCode,
        "vnp_Locale": "vn",
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": orderId, // Mã đơn hàng
        "vnp_OrderInfo": `Thanh toan don hang ${orderId}`,
        "vnp_OrderType": "billpayment",
        "vnp_Amount": amount * 100, // VNPay nhận số tiền tính theo đơn vị VND * 100
        "vnp_ReturnUrl": vnp_ReturnUrl,
        "vnp_CreateDate": createDate,
        "vnp_IpAddr": req.ip
    };

    // Sắp xếp các tham số theo thứ tự bảng chữ cái
    vnp_Params = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});

    // Tạo chuỗi query
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    // Tạo URL thanh toán
    const paymentUrl = `${vnp_Url}?${qs.stringify(vnp_Params, { encode: false })}`;
    res.json({ paymentUrl });
};
const returnPayment = (req, res) => {
    let vnp_Params = req.query;

    // Lấy SecureHash từ URL
    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];

    // Sắp xếp các tham số theo bảng chữ cái
    vnp_Params = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});

    // Kiểm tra chữ ký
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
        if (vnp_Params["vnp_ResponseCode"] === "00") {
            // Thanh toán thành công -> Cập nhật đơn hàng
            return res.json({ status: "success", message: "Thanh toán thành công!" });
        } else {
            return res.json({ status: "failed", message: "Thanh toán thất bại!" });
        }
    } else {
        return res.json({ status: "error", message: "Chữ ký không hợp lệ!" });
    }
};

module.exports = { createPayment, returnPayment };
