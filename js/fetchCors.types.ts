
type FetchCorsOptions = {
//   method?: string;
//   headers?: Record<string, string>;
//   body?: any;
};

export interface FetchCorsInput {
  url: string;
  options?: FetchCorsOptions;
}

export interface FetchCorsResponse {
  headers: Record<string, string>;
  ok: boolean;
  status: number;
  body: string;
}