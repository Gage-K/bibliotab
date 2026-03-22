export interface User {
  id: string;
  username: string;
  email: string;
}

export interface UserWithPassword extends User {
  password: string;
}

export type CreateUserDto = {
  username: string;
  email?: string;
};

export type UpdateUserDto = {
  username?: string;
  email?: string;
  password?: string;
};
