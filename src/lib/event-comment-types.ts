/** API／UI 共用：事件留言序列化列（註解：與 GET `/api/events/[id]/comments` 一致）。 */
export type EventCommentRow = {
  id: string;
  type: "ANNOUNCEMENT" | "COMMENT";
  content: string;
  createdAt: string;
  updatedAt: string;
  authorMemberId: string;
  authorName: string;
};
