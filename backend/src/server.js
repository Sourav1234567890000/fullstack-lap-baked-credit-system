const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");



// Route imports
// 1. Core Authentication
const authRoutes = require("./routes/auth.routes");

// 2. Loan & Workflow Management
const applicantRoutes = require("./routes/applicant.routes");
const lapRoutes = require("./routes/lap.routes");

// 3. Card, Minting & Ledger (Blockchain/Token Assets)
const mintingRoutes = require("./routes/minting.routes");
const marketRoutes = require("./routes/market.routes");

// 4. System Logic & Monitoring
const dagRoutes = require("./routes/dag.routes"); // Directed Acyclic Graph / Workflow state engine
const auditRoutes = require("./routes/audit.routes");




const app = express();

// Connect to MongoDB
console.log("DEBUG: Your MONGO_URI is currently:", process.env.MONGO_URI);
connectDB();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://yourdomain.com"
        : "http://localhost:3000",
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/applicants", applicantRoutes);
app.use("/api/lap", lapRoutes);
app.use("/api/minting", mintingRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dag", dagRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `🚀 Jetro Credit Hub API running on port ${PORT} [${process.env.NODE_ENV}]`,
  );
});

module.exports = app;
