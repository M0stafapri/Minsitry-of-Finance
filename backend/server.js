const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const path = require("path");

dotenv.config();

const connectDB = require("./config/db");
const employeeRouter = require("./routes/employeeRouter");
const customerRouter = require("./routes/customerRouter");
const carTypeRouter = require("./routes/carTypeRouter");
const supplierRouter = require("./routes/supplierRouter");
const tripRouter = require("./routes/tripRouter");
const auditLog = require("./routes/auditLogs");

const globalErrorHandler = require("./middlewares/errorHandler");
const routeNotFoundHandler = require("./middlewares/routeNotFoundHandler");

const app = express();
app.use(cors());
app.use(express.json());

// Add logging middleware to track file access requests
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads/')) {
    console.log('🔍 [FILE_ACCESS] Request for file:', req.path);
    console.log('🔍 [FILE_ACCESS] Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
  }
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`You Are in ${process.env.NODE_ENV} mode`);
}

app.use("/api/v1/employees", employeeRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/cartypes", carTypeRouter);
app.use("/api/v1/suppliers", supplierRouter);
app.use("/api/v1/trips", tripRouter);

app.use("/api/v1/audit-logs", auditLog);

app.use(routeNotFoundHandler);
app.use(globalErrorHandler);

const Port = process.env.PORT || 3000;

const startserver = async () => {
  try {
    await connectDB();
    
    // Check if SSL certificates exist for HTTPS
    const sslOptions = {
      key: process.env.SSL_KEY_PATH ? fs.readFileSync(process.env.SSL_KEY_PATH) : null,
      cert: process.env.SSL_CERT_PATH ? fs.readFileSync(process.env.SSL_CERT_PATH) : null,
    };
    
    if (sslOptions.key && sslOptions.cert && process.env.NODE_ENV === 'production') {
      // Start HTTPS server
      const httpsServer = https.createServer(sslOptions, app);
      httpsServer.listen(Port, () => {
        console.log(`🚀 HTTPS Server is running on port ${Port}`);
      });
      
      // Also start HTTP server to redirect to HTTPS
      const httpApp = express();
      httpApp.use((req, res) => {
        res.redirect(`https://${req.headers.host}${req.url}`);
      });
      httpApp.listen(80, () => {
        console.log(`🔄 HTTP redirect server running on port 80`);
      });
    } else {
      // Start HTTP server (development or no SSL certificates)
      app.listen(Port, () => {
        console.log(`🚀 HTTP Server is running on port ${Port}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API URL: http://localhost:${Port}/api/v1`);
      });
    }
  } catch (error) {
    console.error("🚀 Server startup error:", error);
    process.exit(1);
  }
};

startserver();
