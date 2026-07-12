export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  // Aliases for backward compatibility with pages that use "results"
  results?: T[];
  count?: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
  status?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export type SortOrder = 'asc' | 'desc';

export interface QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}
