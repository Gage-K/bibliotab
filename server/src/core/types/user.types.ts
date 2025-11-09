export interface User {
  id: string;
  username: string;
  email: string;
  created_at: Date;
  last_login: Date;
}

export interface UserWithPassword extends User {
  password: string;
}

export type CreateUserDto = {
  username: string;
  email?: string;
  password: string;
};

export type UpdateUserDto = {
  username?: string;
  email?: string;
  password?: string;
};
