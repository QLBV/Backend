import { Request, Response, NextFunction } from "express";
import { logCreate, logUpdate, logDelete, logView, logExport } from "../services/auditLog.service";

/**
 * Middleware to automatically log CREATE operations
 * Usage: router.post("/patients", auditCreate("patients"), createPatient);
 */
export const auditCreate = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json function
    const originalJson = res.json.bind(res);

    // Override res.json to capture response
    res.json = function (body: any) {
      // Only log if successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log asynchronously (don't wait)
        if (body.success && body.data) {
          const recordId = body.data.id;
          if (recordId) {
            logCreate(req, tableName, recordId, body.data).catch((err) => {
              console.error("Failed to create audit log:", err);
            });
          }
        }
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware to automatically log UPDATE operations
 * Note: This requires the old value to be fetched before update
 * Usage: In controller, call logUpdate manually with old and new values
 */
export const auditUpdate = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store record ID from params
    const recordId = parseInt(req.params.id);

    // Store original json function
    const originalJson = res.json.bind(res);

    // Override res.json to capture response
    res.json = function (body: any) {
      // Only log if successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log asynchronously
        if (body.success && body.data) {
          // Note: oldValue should be stored in req by the controller
          const oldValue = (req as any).oldValue || {};
          logUpdate(req, tableName, recordId, oldValue, body.data).catch((err) => {
            console.error("Failed to create audit log:", err);
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware to automatically log DELETE operations
 */
export const auditDelete = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const recordId = parseInt(req.params.id);

    // Store original json function
    const originalJson = res.json.bind(res);

    // Override res.json to capture response
    res.json = function (body: any) {
      // Only log if successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log asynchronously
        const oldValue = (req as any).oldValue || {};
        logDelete(req, tableName, recordId, oldValue).catch((err) => {
          console.error("Failed to create audit log:", err);
        });
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware to log VIEW operations for sensitive data
 * Usage: router.get("/prescriptions/:id", auditView("prescriptions"), getPrescription);
 */
export const auditView = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const recordId = parseInt(req.params.id);

    // Store original json function
    const originalJson = res.json.bind(res);

    // Override res.json to capture response
    res.json = function (body: any) {
      // Only log if successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log asynchronously
        if (body.success && recordId) {
          logView(req, tableName, recordId).catch((err) => {
            console.error("Failed to create audit log:", err);
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware to log EXPORT operations (PDF, Excel, etc.)
 * Usage: router.get("/prescriptions/:id/pdf", auditExport("prescriptions"), exportPDF);
 */
export const auditExport = (tableName: string, exportType: string = "PDF") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const recordId = parseInt(req.params.id);

    // Store original end function (for PDF downloads)
    const originalEnd = res.end.bind(res);

    // Override res.end to capture download
    res.end = function (...args: any[]) {
      // Only log if successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log asynchronously
        logExport(req, tableName, recordId, { exportType }).catch((err) => {
          console.error("Failed to create audit log:", err);
        });
      }

      return originalEnd(...args);
    };

    next();
  };
};
