const express = require("express");
const { createPayment, returnPayment } = require("../controllers/vnpayController");
const router = express.Router();

router.post("/create-payment", createPayment);
router.get("/vnpay-return", returnPayment);

module.exports = router;
