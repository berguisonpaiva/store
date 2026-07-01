/** Metadados de paginação alinhados ao uso em `DataTable` e ao `PaginationMetaDTO` do backend */
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
