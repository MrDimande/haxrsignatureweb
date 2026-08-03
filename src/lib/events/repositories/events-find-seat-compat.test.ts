import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isFindSeatCompatibilitySchemaError } from "./events.repository";

describe("Find Your Seat schema compatibility", () => {
  it("reconhece coluna ausente durante rollout app-first", () => {
    assert.equal(
      isFindSeatCompatibilitySchemaError({
        code: "42703",
        message: "column find_seat_previous_code does not exist",
      }),
      true
    );
    assert.equal(
      isFindSeatCompatibilitySchemaError({
        message:
          "Could not find the 'find_seat_previous_code_valid_until' column in the schema cache",
      }),
      true
    );
  });

  it("não mascara erros de base de dados não relacionados", () => {
    assert.equal(
      isFindSeatCompatibilitySchemaError({
        code: "08006",
        message: "connection failure",
      }),
      false
    );
  });
});
