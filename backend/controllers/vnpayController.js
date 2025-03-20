const qs = require("qs");
const crypto = require("crypto");

const vnp_TmnCode = process.env.VNP_TMNCODE;
const vnp_HashSecret = process.env.VNP_HASHSECRET;
const vnp_Url = process.env.VNP_URL;
const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

const createPayment = (req, res) => {
    console.log("🔹 Đã vào createPayment");

    const { amount, orderId } = req.body;
    const date = new Date();
    const createDate = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, "0") +
        date.getDate().toString().padStart(2, "0") +
        date.getHours().toString().padStart(2, "0") +
        date.getMinutes().toString().padStart(2, "0") +
        date.getSeconds().toString().padStart(2, "0");

    const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const vnp_IpAddr = ipAddr.split(",")[0].trim();

    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnp_TmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toán đơn hàng ${orderId}`,
        vnp_OrderType: "billpayment",
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: vnp_ReturnUrl,
        vnp_CreateDate: createDate,
        vnp_IpAddr: vnp_IpAddr
    };

    // Sắp xếp tham số đúng thứ tự
    const sortedParams = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});

    // Tạo query string và ký SHA512
    const queryString = qs.stringify(sortedParams, { encode: false });
    console.log("🔹 Query string để ký:", queryString);

    const signed = crypto.createHmac("sha512", vnp_HashSecret)
        .update(queryString)
        .digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;

    // Tạo URL thanh toán
    const paymentUrl = `${vnp_Url}?${qs.stringify(vnp_Params, { encode: false })}`;

    console.log("✅ URL Thanh toán VNPay:", paymentUrl);
    res.json({ paymentUrl });
};

const returnPayment = (req, res) => {
    let vnp_Params = req.query;
    console.log("🔹 Dữ liệu nhận từ VNPay:", vnp_Params);

    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];

    // Sắp xếp tham số đúng thứ tự
    vnp_Params = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});

    // Tạo query string trước khi ký lại
    const signData = qs.stringify(vnp_Params, { encode: false });
    console.log("🔹 Query string trước khi ký lại:", signData);

    const signed = crypto.createHmac("sha512", vnp_HashSecret)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");

    console.log("🔹 SecureHash nhận từ VNPay:", secureHash);
    console.log("🔹 SecureHash tự tạo:", signed);

    if (secureHash === signed) {
        if (vnp_Params["vnp_ResponseCode"] === "00") {
            return res.json({ status: "success", message: "Thanh toán thành công!" });
        } else {
            return res.json({ status: "failed", message: "Thanh toán thất bại!" });
        }
    } else {
        return res.json({ status: "error", message: "Chữ ký không hợp lệ!" });
    }
};

module.exports = { createPayment, returnPayment };
