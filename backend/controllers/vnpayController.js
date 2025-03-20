const qs = require("qs");
const crypto = require("crypto");

const vnp_TmnCode = process.env.VNP_TMNCODE;
const vnp_HashSecret = process.env.VNP_HASHSECRET;
const vnp_Url = process.env.VNP_URL;
const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

const createPayment = (req, res) => {
    console.log("Debug: Đã vào createPayment");
    console.log("VNP_TMNCODE:", vnp_TmnCode);
    console.log("VNP_HASHSECRET:", vnp_HashSecret);
    console.log("VNP_URL:", vnp_Url);
    console.log("VNP_RETURN_URL:", vnp_ReturnUrl);

    console.log("🔹 Nhận request tạo thanh toán:", req.body);
    console.log("🔹 Secret Key đang dùng:", vnp_HashSecret);

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
        "vnp_IpAddr": vnp_IpAddr,
        "vnp_SecureHashType": "SHA512"
    };

    delete vnp_Params["vnp_SecureHash"];

    const sortedParams = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});

    const queryString = qs.stringify(sortedParams, { encode: false });
    console.log("🔹 Query string để ký (trước khi tạo chữ ký):", queryString);

    const signed = crypto.createHmac("sha512", vnp_HashSecret)
        .update(queryString)
        .digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;

    const paymentUrl = `${vnp_Url}?${qs.stringify(vnp_Params, { encode: false })}`;

    console.log("✅ URL Thanh toán VNPay:", paymentUrl);
    res.json({ paymentUrl });
};


const returnPayment = (req, res) => {
    let vnp_Params = req.query;
    console.log("🔹 Dữ liệu nhận từ VNPay:", vnp_Params);

    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];

    vnp_Params["vnp_SecureHashType"] = "SHA512"; // 🔥 Thêm dòng này vào

    vnp_Params = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});

    const signData = qs.stringify(vnp_Params, { encode: false });
    console.log("🔹 Query string trước khi ký lại:", signData);

    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    console.log("🔹 SecureHash nhận được:", secureHash);
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
