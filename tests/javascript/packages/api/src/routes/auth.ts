interface AuthRequest {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  expiresIn: number;
}

// TODO: Implement refresh token rotation
// TODO: Add rate limiting per IP address
export function authRouter() {
  return {
    async login(req: AuthRequest): Promise<AuthResponse> {
      // REVIEW: Should we use bcrypt or argon2 for password hashing?
      if (!req.username || !req.password) {
        throw new Error("Username and password are required");
      }

      // NOTE: This is a stub — replace with actual auth logic
      return {
        token: `token-${req.username}-${Date.now()}`,
        expiresIn: 3600,
      };
    },

    async logout(_token: string): Promise<void> {
      // TODO: Invalidate the token in the token store
    },

    async verify(token: string): Promise<boolean> {
      // FIXME: Actually verify the JWT signature
      return token.length > 0;
    },
  };
}
