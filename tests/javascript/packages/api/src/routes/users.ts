interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
}

export function usersRouter() {
  const users: Map<string, User> = new Map();

  return {
    getUser(id: string): User | undefined {
      return users.get(id);
    },

    listUsers(): User[] {
      // HACK: Converting Map values to array — should use a proper query builder
      return Array.from(users.values());
    },

    createUser(data: Omit<User, "id">): User {
      // BUG: No duplicate email check before creating user
      const id = Math.random().toString(36).slice(2, 10);
      const user: User = { id, ...data };
      users.set(id, user);
      return user;
    },

    deleteUser(id: string): boolean {
      // REVIEW: Should deletion be soft-delete instead of hard-delete?
      return users.delete(id);
    },
  };
}
