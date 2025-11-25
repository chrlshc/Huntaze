-- Add signup tracking fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_method VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_completed_at TIMESTAMP(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP(6);

-- Create index for signup_method
CREATE INDEX IF NOT EXISTS idx_users_signup_method ON users(signup_method);

-- Create NextAuth Account table
CREATE TABLE IF NOT EXISTS nextauth_accounts (
  id TEXT PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  CONSTRAINT nextauth_accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create unique constraint and index for Account
CREATE UNIQUE INDEX IF NOT EXISTS nextauth_accounts_provider_providerAccountId_key 
  ON nextauth_accounts(provider, "providerAccountId");
CREATE INDEX IF NOT EXISTS nextauth_accounts_userId_idx ON nextauth_accounts("userId");

-- Create NextAuth Session table
CREATE TABLE IF NOT EXISTS nextauth_sessions (
  id TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMP(6) NOT NULL,
  CONSTRAINT nextauth_sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for Session
CREATE INDEX IF NOT EXISTS nextauth_sessions_userId_idx ON nextauth_sessions("userId");

-- Create NextAuth VerificationToken table
CREATE TABLE IF NOT EXISTS nextauth_verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create index for VerificationToken
CREATE INDEX IF NOT EXISTS nextauth_verification_tokens_token_idx ON nextauth_verification_tokens(token);
