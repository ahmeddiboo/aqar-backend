const express = require("express");
const router = express.Router();
const areaRateController = require("../controllers/areaRate.controller");
const authMiddleware = require("../middleware/auth.middleware");

// الحصول على جميع المناطق (متاح للجميع)
router.get("/", areaRateController.getAllAreaRates);
router.get("/:id", areaRateController.getAreaRateById);

// عمليات محمية - تتطلب صلاحيات المدير
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo("admin"));

router.post("/", areaRateController.createAreaRate);
router.put("/:id", areaRateController.updateAreaRate);
router.delete("/:id", areaRateController.deleteAreaRate);

module.exports = router;
