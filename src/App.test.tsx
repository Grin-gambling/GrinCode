import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import App from "./App";

describe("App market creation auth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test("requires login before opening the create bet flow for guests", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url === "/api/markets") {
          return {
            ok: true,
            json: async () => [],
          } as Response;
        }

        if (url === "/api/leaderboard") {
          return {
            ok: true,
            json: async () => [],
          } as Response;
        }

        throw new Error(`Unexpected fetch: ${url}`);
      });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/markets");
      expect(fetchSpy).toHaveBeenCalledWith("/api/leaderboard");
    });

    await user.click(
      screen.getByRole("button", { name: /^create bet$/i })
    );

    expect(
      screen.getByText("Please log in to create a bet")
    ).toBeInTheDocument();
    expect(screen.getByText("Welcome back!")).toBeInTheDocument();

    const marketCreationCalls = fetchSpy.mock.calls.filter(
      ([url, options]) =>
        url === "/api/markets" &&
        typeof options === "object" &&
        options !== null &&
        "method" in options &&
        options.method === "POST"
    );

    expect(marketCreationCalls).toHaveLength(0);
  });
});
