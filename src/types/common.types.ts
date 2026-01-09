/**
 * Common types used across the application
 * Reduces use of 'any' type for better type safety
 */

// Sequelize where clause types
export interface WhereClause {
  [key: string]: any;
}

// Pagination types
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

// Date range filter
export interface DateRangeFilter {
  startDate?: string | Date;
  endDate?: string | Date;
}

// Common service response
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error with context
export interface ErrorWithContext extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}
