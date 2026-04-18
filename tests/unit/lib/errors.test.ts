import { describe, it, expect } from "vitest";
import { AppError } from "@/lib/errors";

describe("AppError", () => {
  it("creates a badRequest error", () => {
    const err = AppError.badRequest("Invalid input");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toBe("Invalid input");
  });

  it("creates an unauthorized error with default message", () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("creates a notFound error with resource name", () => {
    const err = AppError.notFound("Talent");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Talent not found");
  });

  it("creates a conflict error", () => {
    const err = AppError.conflict("Email already exists");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("creates a validationError with details", () => {
    const details = { fieldErrors: { email: ["Invalid email"] } };
    const err = AppError.validationError(details);
    expect(err.statusCode).toBe(422);
    expect(err.details).toEqual(details);
  });

  it("is instanceof Error", () => {
    expect(AppError.internal() instanceof Error).toBe(true);
  });
});
