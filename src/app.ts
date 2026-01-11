import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import userRoutes from "./routes/user.routes";
import employeeRoutes from "./routes/employee.routes";
import authRoutes from "./routes/auth.routes";
import patientRoutes from "./routes/patient.routes";
import appointmentRoutes from "./routes/appointment.routes";
import { errorHandler } from "./middlewares/errorHandler.middlewares";
import visitRoutes from "./routes/visit.routes";
import notificationRoutes from "./routes/notification.routes";
import medicineRoutes from "./routes/medicine.routes";
import medicineImportRoutes from "./routes/medicineImport.routes";
import medicineExportRoutes from "./routes/medicineExport.routes";
import prescriptionRoutes from "./routes/prescription.routes";
import invoiceRoutes from "./routes/invoice.routes";
import payrollRoutes from "./routes/payroll.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reportRoutes from "./routes/report.routes";
import oauthRoutes from "./routes/oauth.routes";
import permissionRoutes from "./routes/permission.routes";
import profileRoutes from "./routes/profile.routes";
import attendanceRoutes from "./routes/attendance.routes";
import searchRoutes from "./routes/search.routes";
import { corsOptions } from "./config/cors.config";
import passport from "./config/oauth.config";
import auditLogRoutes from "./routes/auditLog.routes";
import jobRoutes from "./routes/job.routes";

const rateLimitWindowMsEnv = Number(process.env.RATE_LIMIT_WINDOW_MS);
const rateLimitMaxEnv = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
const rateLimitWindowMs =
  Number.isFinite(rateLimitWindowMsEnv) && rateLimitWindowMsEnv > 0
    ? rateLimitWindowMsEnv
    : 15 * 60 * 1000;
const rateLimitMax =
  Number.isFinite(rateLimitMaxEnv) && rateLimitMaxEnv > 0 ? rateLimitMaxEnv : 600;

const app: Application = express();
// Ensure we read real client IPs when running behind a reverse proxy (affects rate limiting)
app.set("trust proxy", 1);
// Morgan logging
app.use(morgan("dev"));

// LOGGING FIRST - Before anything else!
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`\n📥 INCOMING: ${req.method} ${req.url}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `📤 RESPONSE: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)\n`
    );
  });

  next();
});

// Security Middlewares
app.use(helmet());
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: rateLimitWindowMs, // configurable via RATE_LIMIT_WINDOW_MS
  max: rateLimitMax, // configurable via RATE_LIMIT_MAX_REQUESTS
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api", limiter);

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Initialize Passport for OAuth
app.use(passport.initialize());

// Health Check Route
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Healthcare Management System API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/oauth", oauthRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/patients", patientRoutes); // Placeholder, replace with actual patientRoutes
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/doctors", require("./routes/doctor.routes").default);
app.use("/api/doctor-shifts", require("./routes/doctorShift.routes").default);
app.use("/api/specialties", require("./routes/specialty.routes").default);
app.use("/api/notifications", notificationRoutes);
app.use("/api/shifts", require("./routes/shift.routes").default);
app.use("/api/shift-templates", require("./routes/shiftTemplate.routes").default);
app.use("/api/schedule-generation", require("./routes/scheduleGeneration.routes").default);
app.use("/api/medicines", medicineRoutes);
app.use("/api/medicine-imports", medicineImportRoutes);
app.use("/api/medicine-exports", medicineExportRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payrolls", payrollRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/jobs", jobRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
