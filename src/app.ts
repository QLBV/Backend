import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import userRoutes from "./modules/user/user.routes";
import employeeRoutes from "./modules/user/employee.routes";
import authRoutes from "./modules/auth/auth.routes";
import patientRoutes from "./modules/patient/patient.routes";
import appointmentRoutes from "./modules/appointment/appointment.routes";
import { errorHandler } from "./middlewares/errorHandler.middlewares";
import visitRoutes from "./modules/appointment/visit.routes";
import notificationRoutes from "./modules/notification/notification.routes";
import medicineRoutes from "./modules/inventory/medicine.routes";
import medicineImportRoutes from "./modules/inventory/medicineImport.routes";
import medicineExportRoutes from "./modules/inventory/medicineExport.routes";
import prescriptionRoutes from "./modules/appointment/prescription.routes";
import invoiceRoutes from "./modules/finance/invoice.routes";
import payrollRoutes from "./modules/finance/payroll.routes";
import dashboardRoutes from "./modules/admin/dashboard.routes";
import reportRoutes from "./modules/admin/report.routes";
import oauthRoutes from "./modules/auth/oauth.routes";
import permissionRoutes from "./modules/user/permission.routes";
import profileRoutes from "./modules/auth/profile.routes";
import attendanceRoutes from "./modules/shift/attendance.routes";
import searchRoutes from "./modules/misc/search.routes";
import { corsOptions } from "./config/cors.config";
import passport from "./config/oauth.config";
import auditLogRoutes from "./modules/admin/auditLog.routes";
import jobRoutes from "./modules/misc/job.routes";
import systemRoutes from "./modules/admin/system.routes";
import { checkMaintenance } from "./middlewares/maintenance.middlewares";

const rateLimitWindowMsEnv = Number(process.env.RATE_LIMIT_WINDOW_MS);
const rateLimitMaxEnv = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
const rateLimitWindowMs =
  Number.isFinite(rateLimitWindowMsEnv) && rateLimitWindowMsEnv > 0
    ? rateLimitWindowMsEnv
    : 15 * 60 * 1000;
const rateLimitMax =
  Number.isFinite(rateLimitMaxEnv) && rateLimitMaxEnv > 0 ? rateLimitMaxEnv : 5000;

const app: Application = express();


app.set("trust proxy", 1);


app.use(morgan("dev"));


app.use((req, res, next) => {
  const start = Date.now();
  console.log(`\nINCOMING: ${req.method} ${req.url}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `RESPONSE: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)\n`
    );
  });

  next();
});


app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors(corsOptions));


const limiter = rateLimit({
  windowMs: rateLimitWindowMs, 
  max: rateLimitMax, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api", limiter);


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));


app.use(passport.initialize());



app.use("/api", checkMaintenance);


app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Healthcare Management System API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});


app.use("/api/auth", authRoutes);
app.use("/api/auth/oauth", oauthRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/doctors", require( "./modules/doctor/doctor.routes").default);
app.use("/api/doctor-shifts", require( "./modules/doctor/doctorShift.routes").default);
app.use("/api/specialties", require( "./modules/doctor/specialty.routes").default);
app.use("/api/notifications", notificationRoutes);
app.use("/api/shifts", require( "./modules/shift/shift.routes").default);
app.use("/api/shift-templates", require( "./modules/shift/shiftTemplate.routes").default);
app.use("/api/schedule-generation", require( "./modules/shift/scheduleGeneration.routes").default);
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
app.use("/api/contact", require( "./modules/misc/contact.routes").default);
app.use("/api/system", systemRoutes);


app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});


app.use(errorHandler);

export default app;
