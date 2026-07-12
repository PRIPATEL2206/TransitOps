export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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
