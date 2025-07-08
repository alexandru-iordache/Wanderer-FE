import { Uuid } from "../../../shared/helpers/uuid";

export interface PostCommentDto {
  id: Uuid;
  userId: Uuid;
  content: string;
  createdAt: Date;
  profileName: string;
  avatarUrl?: string;
}