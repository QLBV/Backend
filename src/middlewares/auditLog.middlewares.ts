import { Request, Response, NextFunction } from "express";
import { logCreate, logUpdate, logDelete, logView, logExport } from "../modules/admin/auditLog.service";

export const auditCreate = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
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


export const auditUpdate = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const recordId = parseInt(req.params.id);
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (body.success && body.data) {
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

export const auditDelete = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const recordId = parseInt(req.params.id);
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
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

export const auditView = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const recordId = parseInt(req.params.id);
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
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

export const auditExport = (tableName: string, exportType: string = "PDF") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const recordId = parseInt(req.params.id); 
    const originalEnd = res.end.bind(res)
    res.end = function (...args: any[]) {
      if (res.statusCode >= 200 && res.statusCode < 300) { 
        logExport(req, tableName, recordId, { exportType }).catch((err) => {
          console.error("Failed to create audit log:", err);
        });
      }
      return originalEnd(...args);
    };
    next();
  };
};
