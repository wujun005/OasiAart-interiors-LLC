import http from '@/modules/admin/utils/request';

export type CommentPageQuery = {
  spuId?: number;
  isMock?: boolean;
  isShowClient?: boolean;
  keyword?: string;
  pageNum: number;
  pageSize: number;
};

export type CommentRow = {
  commentId?: number;
  spuId?: number;
  spuName?: string;
  nameI18n?: Record<string, string>;
  packageService?: number;
  orderId?: number;
  rating?: number;
  content?: string;
  commentTime?: string;
  userId?: number;
  userName?: string;
  userPhone?: string;
  avatarUrl?: string;
  isMock?: boolean;
  isShowClient?: boolean;
};

export type CommentPage = {
  list?: CommentRow[];
  total?: number;
  pageNum?: number;
  pageSize?: number;
};

export function commentPage(payload: CommentPageQuery) {
  return http.post('/api/comment/page', payload) as Promise<CommentPage>;
}

export function addMockComment(payload: {
  spuId: number;
  content: string;
  rating?: number;
  userId?: number;
  isShow?: boolean;
}) {
  return http.post('/api/comment/addMock', payload) as Promise<number>;
}

export function updateCommentShow(commentId: number, isShow: boolean) {
  return http.post('/api/comment/updateShow', { commentId, isShow }) as Promise<boolean>;
}

export function deleteComment(commentId: number) {
  return http.post('/api/comment/delete', { commentId }) as Promise<boolean>;
}
