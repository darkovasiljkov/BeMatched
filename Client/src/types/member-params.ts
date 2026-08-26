export type MemberOrder = 'lastActive' | 'created';

export interface MemberFilters {
  gender?: string;
  minAge: number;
  maxAge: number;
  orderBy: MemberOrder;
}

export interface MemberParams extends MemberFilters {
  pageNumber: number;
  pageSize: number;
}
