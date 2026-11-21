import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../config/db";
import { usersTable, rolesTable } from "../../config/schema";
import type {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
} from "../../validations/auth/auth.validation";

// REGISTER
export async function registerUser(data: RegisterInput) {
  // Check existing email
  const existingUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, data.email),
  });

  if (existingUser) {
    throw new Error("EMAIL_EXISTS");
  }

  // Get customer role
  const customerRole = await db.query.rolesTable.findFirst({
    where: eq(rolesTable.title, "customer"),
  });

  if (!customerRole) {
    throw new Error("CUSTOMER_ROLE_NOT_FOUND");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  // Create user
  const [newUser] = await db
    .insert(usersTable)
    .values({
      roleId: customerRole.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
    })
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
    });

  return newUser;
}

// LOGIN
export async function loginUser(data: LoginInput) {
  // Find user and role
  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      password: usersTable.password,
      role: rolesTable.title,
    })
    .from(usersTable)
    .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
    .where(eq(usersTable.email, data.email))
    .limit(1);

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Check JWT secret
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET_NOT_CONFIGURED");
  }

  // Generate JWT
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: "1d" },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

// CHANGE PASSWORD
export async function changePassword(
  userId: number,
  data: ChangePasswordInput,
) {
  // Find user
  const [user] = await db
    .select({
      id: usersTable.id,
      password: usersTable.password,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(
    data.currentPassword,
    user.password,
  );

  if (!isPasswordValid) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  // Prevent reusing current password
  const isSamePassword = await bcrypt.compare(data.newPassword, user.password);

  if (isSamePassword) {
    throw new Error("SAME_PASSWORD");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(data.newPassword, 12);

  // Update password
  await db
    .update(usersTable)
    .set({
      password: hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId));

  return {
    message: "Password changed successfully",
  };
}
