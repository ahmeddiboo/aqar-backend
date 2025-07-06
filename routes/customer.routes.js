const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Protect all customer routes with authentication
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo("admin"));

// Customer routes
router.post("/", customerController.createCustomer);
router.get("/", customerController.getAllCustomers);
router.get("/:id", customerController.getCustomerById);
router.patch("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);
router.post("/:id/interactions", customerController.addInteraction);

module.exports = router;
