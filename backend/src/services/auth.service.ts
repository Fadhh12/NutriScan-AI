import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import type { JwtPayload, PublicUser, User } from "../models/types";

const SALT_ROUNDS = 10;

function toPublicUser(user: User): PublicUser {
  const { password_hash: _password_hash, ...publicUser } = user;
  return publicUser;
}

function signToken(user: Pick<User, "id" | "email">): string {
  const payload: JwtPayload = { sub: user.id, email: user.email };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  dailyCalorieTarget?: number;
}): Promise<{ user: PublicUser; token: string }> {
  const email = input.email.toLowerCase().trim();

  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(`Failed to check existing user: ${lookupError.message}`, 500);
  }
  if (existing) {
    throw new AppError("Email already registered", 409, "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      name: input.name,
      email,
      password_hash: passwordHash,
      daily_calorie_target: input.dailyCalorieTarget ?? null,
    })
    .select()
    .single();

  if (insertError || !created) {
    throw new AppError(`Failed to create user: ${insertError?.message ?? "unknown error"}`, 500);
  }

  const user = created as User;
  return { user: toPublicUser(user), token: signToken(user) };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  const email = input.email.toLowerCase().trim();

  const { data: found, error } = await supabase
    .from("users")
    .select()
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new AppError(`Failed to look up user: ${error.message}`, 500);
  }
  if (!found) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const user = found as User;
  const passwordMatches = await bcrypt.compare(input.password, user.password_hash);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  return { user: toPublicUser(user), token: signToken(user) };
}

export async function getUserById(userId: string): Promise<PublicUser> {
  const { data, error } = await supabase.from("users").select().eq("id", userId).maybeSingle();
  if (error) {
    throw new AppError(`Failed to load user: ${error.message}`, 500);
  }
  if (!data) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
  return toPublicUser(data as User);
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
  }
}
