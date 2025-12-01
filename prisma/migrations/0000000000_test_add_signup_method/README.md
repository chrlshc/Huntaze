# Test Migration: Add signup_method column for Vitest

This migration is added solely for local/test environments to align the schema with property tests that expect the `users.signup_method` column.

- Adds nullable `signup_method` VARCHAR(50) to `users` if missing
- Adds index `idx_users_signup_method` if missing

Safe to run repeatedly; uses IF NOT EXISTS guards.
