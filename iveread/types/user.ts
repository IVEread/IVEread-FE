export type User = {
  id: string;
  email: string;
  nickname: string;
  emoji: string | null;
};

export type UserProfile = User;

export type CreateUserInput = {
  email: string;
  password: string;
  nickname: string;
  emoji?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type UpdateUserInput = {
  nickname?: string;
  emoji?: string;
};
