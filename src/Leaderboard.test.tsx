import { test, expect } from "vitest";

test("dom exists", () => {
  expect(typeof document).toBe("object");
});