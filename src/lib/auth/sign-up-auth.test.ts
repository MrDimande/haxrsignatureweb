import assert from "node:assert/strict";
import test from "node:test";
import {
  hasSignUpFieldErrors,
  validateSignUpCredentials,
  validateSignUpInput,
} from "./sign-up-auth";

test("activation request validation enforces consent and a strong password", () => {
  const errors = validateSignUpCredentials({ email: "client@example.com", password: "short", termsAccepted: false });
  assert.ok(errors.password);
  assert.ok(errors.termsAccepted);
});

test("self-registration input validation enforces full name, valid email, and terms consent", () => {
  const missingAll = validateSignUpInput({ email: "", termsAccepted: false });
  assert.equal(missingAll.fullName, "Introduza o seu nome completo.");
  assert.equal(missingAll.email, "Introduza um endereço de email válido.");
  assert.equal(missingAll.termsAccepted, "Aceite os termos para continuar.");
  assert.equal(hasSignUpFieldErrors(missingAll), true);

  const invalidEmail = validateSignUpInput({
    fullName: "Ana Silva",
    email: "not-an-email",
    termsAccepted: true,
  });
  assert.equal(invalidEmail.fullName, undefined);
  assert.equal(invalidEmail.email, "Introduza um endereço de email válido.");
  assert.equal(invalidEmail.termsAccepted, undefined);
  assert.equal(hasSignUpFieldErrors(invalidEmail), true);

  const valid = validateSignUpInput({
    fullName: "Ana Silva",
    email: "ana.silva@example.com",
    termsAccepted: true,
  });
  assert.deepEqual(valid, {});
  assert.equal(hasSignUpFieldErrors(valid), false);
});
