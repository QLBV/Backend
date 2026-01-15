


export interface WhereClause {
  [key: string]: any;
}


export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


export interface DateRangeFilter {
  startDate?: string | Date;
  endDate?: string | Date;
}


export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}


export interface ErrorWithContext extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}


export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
