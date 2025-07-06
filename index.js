require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Import routes
const propertyRoutes = require("./routes/property.routes");
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const chatbotRoutes = require("./routes/chatbot.routes");
const areaRateRoutes = require("./routes/areaRate.routes");
const adminRoutes = require("./routes/admin.routes");
const messageRoutes = require("./routes/message.routes");
const featureRoutes = require("./routes/feature.routes");
const projectRoutes = require("./routes/project.routes");
const customerRoutes = require("./routes/customer.routes");
const propertyPaymentPlanRoutes = require("./routes/propertyPaymentPlan.routes");

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets (like uploaded images) from 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/properties", propertyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/area-rates", areaRateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/features", featureRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/properties/:propertyId/payment-plans", propertyPaymentPlanRoutes);

// Trust first proxy when deployed behind proxy services like Railway
app.set("trust proxy", 1);

// Global error handling middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Base route for API testing
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "عقار كام API is running successfully!" });
});

// Add support for Railway health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "عقار كام API is running successfully!",
    environment: process.env.NODE_ENV || "production",
    host: req.hostname,
    instanceId: process.env.RAILWAY_SERVICE_ID || "local",
  });
});

// MongoDB connection (using connection string from .env)
const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL;

// Check if MONGO_URI exists before connecting
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in the .env file!");
  console.error(
    "Please add MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname to your .env file"
  );
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas database successfully!");
    console.log(`🌐 Connection string: ${MONGO_URI.substring(0, 20)}...`);

    // Start the server after successful database connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(
        `🏠 Hostname: ${process.env.RAILWAY_STATIC_URL || "localhost"}`
      );
      console.log(`🔑 Environment: ${process.env.NODE_ENV || "production"}`);
      console.log(`📝 API documentation available at /api/health`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // Do not exit the process in development, but log the error
});
