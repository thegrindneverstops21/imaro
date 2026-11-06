export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface Session {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

export interface GoogleUserInput extends GoogleProfile {
  role: string;
}

export interface PasswordUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}

// A local account stores a password hash; accounts created through Google leave it null.
export interface PasswordAccount extends SessionUser {
  passwordHash: string | null;
}
