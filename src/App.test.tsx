import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import App from "./App";

// ─── Shared fixtures ───────────────────────────────────────────────────────────

const MOCK_TOKEN = "mock-auth-token";

const MOCK_USER = {
  id: "user-1",
  username: "testuser",
  email: "test@example.com",
  balance: 500,
  created_at: "2024-01-01T00:00:00Z",
};

const MOCK_MARKET_ROWS = [
  {
    id: "market-1",
    question: "Will it rain tomorrow?",
    description: "A bet about tomorrow's weather.",
    status: "open",
    closes_at: new Date(Date.now() + 86400000).toISOString(),
    winning_outcome_id: null,
    outcome_id: "outcome-yes",
    label: "Yes",
    total_amount: 100,
    total_upvotes: 5,
    total_downvotes: 1,
  },
  {
    id: "market-1",
    question: "Will it rain tomorrow?",
    description: "A bet about tomorrow's weather.",
    status: "open",
    closes_at: new Date(Date.now() + 86400000).toISOString(),
    winning_outcome_id: null,
    outcome_id: "outcome-no",
    label: "No",
    total_amount: 200,
    total_upvotes: 5,
    total_downvotes: 1,
  },
];

const MOCK_LEADERBOARD = [
  { id: "user-1", username: "testuser", balance: 500 },
  { id: "user-2", username: "otheruser", balance: 300 },
];

function mockBaseFetch(overrides: Record<string, () => Response> = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, options) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url in overrides) return overrides[url]();
    if (url === "/api/markets" && (options as RequestInit)?.method === "POST") {
      return { ok: true, json: async () => ({ id: "new-market" }) } as Response;
    }
    if (url === "/api/markets") {
      return { ok: true, json: async () => MOCK_MARKET_ROWS } as Response;
    }
    if (url === "/api/leaderboard") {
      return { ok: true, json: async () => MOCK_LEADERBOARD } as Response;
    }
    if (url === "/api/auth/me") {
      return { ok: true, json: async () => ({ user: MOCK_USER }) } as Response;
    }
    if (url === "/api/auth/logout") {
      return { ok: true, json: async () => ({}) } as Response;
    }

    throw new Error(`Unexpected fetch: ${url}`);
  });
}

async function renderApp() {
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() =>
    expect(screen.queryByText("Loading markets...")).not.toBeInTheDocument()
  );
  return user;
}

async function renderAppLoggedIn() {
  localStorage.setItem("grincodeAuthToken", MOCK_TOKEN);
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() =>
    expect(screen.queryByText("Loading markets...")).not.toBeInTheDocument()
  );
  await waitFor(() =>
    expect(screen.getByText(`Log Out (${MOCK_USER.username})`)).toBeInTheDocument()
  );
  return user;
}

// ─── Initial load ──────────────────────────────────────────────────────────────

describe("initial load", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test("renders app title", () => {
    render(<App />);
    expect(screen.getByText("Top Bets")).toBeInTheDocument();
  });

  test("shows loading state then renders markets", async () => {
    mockBaseFetch();
    render(<App />);
    expect(screen.getByText("Loading markets...")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Loading markets...")).not.toBeInTheDocument()
    );
    expect(screen.getAllByText("Will it rain tomorrow?").length).toBeGreaterThan(0);
  });

  test("shows error message when markets fail to load", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/leaderboard") {
        return { ok: true, json: async () => [] } as Response;
      }
      return { ok: false, json: async () => ({ error: "Server error" }) } as Response;
    });

    render(<App />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });

  test("fetches markets and leaderboard on mount", async () => {
    const fetchSpy = mockBaseFetch();
    await renderApp();
    expect(fetchSpy).toHaveBeenCalledWith("/api/markets");
    expect(fetchSpy).toHaveBeenCalledWith("/api/leaderboard");
  });
});

// ─── Auth: stored token ────────────────────────────────────────────────────────

describe("stored auth token", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test("validates a stored token on mount and shows username", async () => {
    localStorage.setItem("grincodeAuthToken", MOCK_TOKEN);
    mockBaseFetch();
    await renderApp();
    await waitFor(() =>
      expect(screen.getByText(`Log Out (${MOCK_USER.username})`)).toBeInTheDocument()
    );
  });

  test("clears an invalid stored token and shows Login button", async () => {
    localStorage.setItem("grincodeAuthToken", "bad-token");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/auth/me") {
        return { ok: false, json: async () => ({}) } as Response;
      }
      if (url === "/api/markets") {
        return { ok: true, json: async () => [] } as Response;
      }
      if (url === "/api/leaderboard") {
        return { ok: true, json: async () => [] } as Response;
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    await renderApp();
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(localStorage.getItem("grincodeAuthToken")).toBeNull();
  });
});

// ─── Auth: login modal ─────────────────────────────────────────────────────────

describe("login modal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test("opens when Login button is clicked", async () => {
    mockBaseFetch();
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: /^login$/i }));
    expect(screen.getByRole("dialog", { name: /login/i })).toBeInTheDocument();
  });

  test("closes when Escape is pressed", async () => {
    mockBaseFetch();
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: /^login$/i }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: /login/i })).not.toBeInTheDocument();
  });

  test("closes when backdrop is clicked", async () => {
    mockBaseFetch();
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: /^login$/i }));
    const dialog = screen.getByRole("dialog", { name: /login/i });
    await user.click(dialog.parentElement!);
    expect(screen.queryByRole("dialog", { name: /login/i })).not.toBeInTheDocument();
  });
});

// ─── Auth: register modal ──────────────────────────────────────────────────────

describe("register modal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test("opens when Sign Up is clicked", async () => {
    mockBaseFetch();
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    expect(screen.getByRole("dialog", { name: /register/i })).toBeInTheDocument();
  });

  test("closes when Escape is pressed", async () => {
    mockBaseFetch();
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: /register/i })).not.toBeInTheDocument();
  });

  test("closes when backdrop is clicked", async () => {
    mockBaseFetch();
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    const dialog = screen.getByRole("dialog", { name: /register/i });
    await user.click(dialog.parentElement!);
    expect(screen.queryByRole("dialog", { name: /register/i })).not.toBeInTheDocument();
  });
});

// ─── Auth: logout ──────────────────────────────────────────────────────────────

describe("logout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test("clears token and shows Login button after logout", async () => {
    mockBaseFetch();
    const user = await renderAppLoggedIn();
    await user.click(screen.getByRole("button", { name: /log out/i }));
    await waitFor(() => expect(screen.getByText("Login")).toBeInTheDocument());
    expect(localStorage.getItem("grincodeAuthToken")).toBeNull();
  });

  test("calls logout endpoint with auth header", async () => {
    const fetchSpy = mockBaseFetch();
    const user = await renderAppLoggedIn();
    await user.click(screen.getByRole("button", { name: /log out/i }));
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/auth/logout",
        expect.objectContaining({ method: "POST" })
      )
    );
  });
});

// ─── Market creation ───────────────────────────────────────────────────────────

describe("market creation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test("guest clicking Create Bet shows error and opens login modal", async () => {
    mockBaseFetch();
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: /^create bet$/i }));
    expect(screen.getByText("Please log in to create a bet")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /login/i })).toBeInTheDocument();
  });

  test("logged-in user can open create bet modal", async () => {
    mockBaseFetch();
    const user = await renderAppLoggedIn();
    await user.click(screen.getByRole("button", { name: /^create bet$/i }));
    expect(screen.getByRole("dialog", { name: /create bet/i })).toBeInTheDocument();
  });

  test("create bet modal closes on Escape", async () => {
    mockBaseFetch();
    const user = await renderAppLoggedIn();
    await user.click(screen.getByRole("button", { name: /^create bet$/i }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: /create bet/i })).not.toBeInTheDocument();
  });

  test("create bet modal closes when backdrop is clicked", async () => {
    mockBaseFetch();
    const user = await renderAppLoggedIn();
    await user.click(screen.getByRole("button", { name: /^create bet$/i }));
    const dialog = screen.getByRole("dialog", { name: /create bet/i });
    await user.click(dialog.parentElement!);
    expect(screen.queryByRole("dialog", { name: /create bet/i })).not.toBeInTheDocument();
  });

  test("submitting with empty fields does nothing", async () => {
    const fetchSpy = mockBaseFetch();
    const user = await renderAppLoggedIn();
    await user.click(screen.getByRole("button", { name: /^create bet$/i }));
    const dialog = screen.getByRole("dialog", { name: /create bet/i });
    await user.click(within(dialog).getByRole("button", { name: /^create bet$/i }));
    // modal still open, no POST fired
    expect(screen.getByRole("dialog", { name: /create bet/i })).toBeInTheDocument();
    expect(
      fetchSpy.mock.calls.filter(
        ([url, opts]) =>
          url === "/api/markets" && (opts as RequestInit)?.method === "POST"
      )
    ).toHaveLength(0);
  });

  test("successful submission closes modal and fires POST", async () => {
    const fetchSpy = mockBaseFetch();
    const user = await renderAppLoggedIn();
    await user.click(screen.getByRole("button", { name: /^create bet$/i }));

    await user.type(screen.getByLabelText(/bet title/i), "My Market");
    await user.type(screen.getByLabelText(/bet description/i), "Some description");
    await user.type(screen.getByLabelText(/left option/i), "Yes");
    await user.type(screen.getByLabelText(/right option/i), "No");
    await user.type(screen.getByLabelText(/closing date/i), "2099-12-31T23:59");

    const dialog = screen.getByRole("dialog", { name: /create bet/i });
    await user.click(within(dialog).getByRole("button", { name: /^create bet$/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: /create bet/i })
      ).not.toBeInTheDocument()
    );
    expect(
      fetchSpy.mock.calls.filter(
        ([url, opts]) =>
          url === "/api/markets" && (opts as RequestInit)?.method === "POST"
      )
    ).toHaveLength(1);
  });

  test("failed submission shows error and keeps modal open", async () => {
    localStorage.setItem("grincodeAuthToken", MOCK_TOKEN);
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, options) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/auth/me") {
        return { ok: true, json: async () => ({ user: MOCK_USER }) } as Response;
      }
      if (url === "/api/markets" && (options as RequestInit)?.method === "POST") {
        return {
          ok: false,
          json: async () => ({ error: "Market creation failed" }),
        } as Response;
      }
      if (url === "/api/markets") {
        return { ok: true, json: async () => [] } as Response;
      }
      if (url === "/api/leaderboard") {
        return { ok: true, json: async () => [] } as Response;
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const user = await renderApp();
    await waitFor(() =>
      expect(screen.getByText(`Log Out (${MOCK_USER.username})`)).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: /^create bet$/i }));
    await user.type(screen.getByLabelText(/bet title/i), "My Market");
    await user.type(screen.getByLabelText(/bet description/i), "Some description");
    await user.type(screen.getByLabelText(/left option/i), "Yes");
    await user.type(screen.getByLabelText(/right option/i), "No");
    await user.type(screen.getByLabelText(/closing date/i), "2099-12-31T23:59");
    const dialog = screen.getByRole("dialog", { name: /create bet/i });
    await user.click(within(dialog).getByRole("button", { name: /^create bet$/i }));

    await waitFor(() =>
      expect(screen.getByText("Market creation failed")).toBeInTheDocument()
    );
    expect(screen.getByRole("dialog", { name: /create bet/i })).toBeInTheDocument();
  });
});

// ─── Navigation ────────────────────────────────────────────────────────────────

describe("navigation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test("switches to minigames view", async () => {
    mockBaseFetch();
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: /minigames/i }));
    expect(screen.getByTitle("Grin Gamblers Minigames")).toBeInTheDocument();
    expect(screen.queryAllByText("Will it rain tomorrow?")).toHaveLength(0);
  });

  test("switches back to markets from minigames", async () => {
    mockBaseFetch();
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: /minigames/i }));
    await user.click(screen.getByRole("button", { name: /^market$/i }));
    expect(screen.getAllByText("Will it rain tomorrow?").length).toBeGreaterThan(0);
  });

  test("Create Bet button is hidden in minigames view", async () => {
    mockBaseFetch();
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: /minigames/i }));
    expect(
      screen.queryAllByRole("button", { name: /^create bet$/i })
    ).toHaveLength(0);
  });

  test("shows guest note in minigames view when not logged in", async () => {
    mockBaseFetch();
    const user = await renderApp();
    await user.click(screen.getByRole("button", { name: /minigames/i }));
    expect(
      screen.getByText(/log in first if you want your minigame acorns/i)
    ).toBeInTheDocument();
  });

  test("shows sync note in minigames view when logged in", async () => {
    mockBaseFetch();
    const user = await renderAppLoggedIn();
    await user.click(screen.getByRole("button", { name: /minigames/i }));
    expect(
      screen.getByText(/minigame wins and losses sync directly/i)
    ).toBeInTheDocument();
  });

  test("grin:navigate message switches to minigames view", async () => {
    mockBaseFetch();
    await renderApp();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "grin:navigate", view: "minigames" },
        origin: window.location.origin,
      })
    );
    await waitFor(() =>
      expect(screen.getByTitle("Grin Gamblers Minigames")).toBeInTheDocument()
    );
  });
});

// ─── Acorn balance ─────────────────────────────────────────────────────────────

describe("acorn balance", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test("shows default guest balance of 1000", async () => {
    mockBaseFetch();
    await renderApp();
    expect(screen.getByText("1000")).toBeInTheDocument();
  });

  test("shows logged-in user balance", async () => {
    mockBaseFetch();
    await renderAppLoggedIn();
    await waitFor(() =>
      expect(screen.getByText(String(MOCK_USER.balance))).toBeInTheDocument()
    );
  });

  test("updates guest balance from minigame message", async () => {
    mockBaseFetch();
    await renderApp();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "grin:minigames-balance", balance: 750 },
        origin: window.location.origin,
      })
    );
    await waitFor(() => expect(screen.getByText("750")).toBeInTheDocument());
  });

  test("shows warning when guest acorns change via minigame", async () => {
    mockBaseFetch();
    await renderApp();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "grin:minigames-balance", balance: 750 },
        origin: window.location.origin,
      })
    );
    await waitFor(() =>
      expect(
        screen.getByText(/guest minigame acorns are local only/i)
      ).toBeInTheDocument()
    );
  });

  test("ignores minigame messages from foreign origins", async () => {
    mockBaseFetch();
    await renderApp();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "grin:minigames-balance", balance: 9999 },
        origin: "https://evil.com",
      })
    );
    await waitFor(() =>
      expect(screen.queryByText("9999")).not.toBeInTheDocument()
    );
  });

  test("ignores minigame messages with negative balance", async () => {
    mockBaseFetch();
    await renderApp();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "grin:minigames-balance", balance: -100 },
        origin: window.location.origin,
      })
    );
    // balance stays 1000
    await waitFor(() => expect(screen.getByText("1000")).toBeInTheDocument());
    expect(screen.queryByText("-100")).not.toBeInTheDocument();
  });

  test("ignores minigame message with same balance as current", async () => {
    mockBaseFetch();
    await renderApp();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "grin:minigames-balance", balance: 1000 },
        origin: window.location.origin,
      })
    );
    await waitFor(() =>
      expect(
        screen.queryByText(/guest minigame acorns are local only/i)
      ).not.toBeInTheDocument()
    );
  });

  test("syncs logged-in user balance from minigame and calls balance endpoint", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, options) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "/api/auth/me") {
          return { ok: true, json: async () => ({ user: MOCK_USER }) } as Response;
        }
        if (url === "/api/markets") {
          return { ok: true, json: async () => [] } as Response;
        }
        if (url === "/api/leaderboard") {
          return { ok: true, json: async () => MOCK_LEADERBOARD } as Response;
        }
        if (url === "/api/auth/me/balance") {
          return {
            ok: true,
            json: async () => ({ user: { ...MOCK_USER, balance: 800 } }),
          } as Response;
        }
        throw new Error(`Unexpected fetch: ${url}`);
      });

    await renderAppLoggedIn();

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "grin:minigames-balance", balance: 800 },
        origin: window.location.origin,
      })
    );

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/auth/me/balance",
        expect.objectContaining({ method: "POST" })
      )
    );
    await waitFor(() => expect(screen.getByText("800")).toBeInTheDocument());
  });
});

// ─── Markets rendering ─────────────────────────────────────────────────────────

describe("markets rendering", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test("renders market titles from API", async () => {
    mockBaseFetch();
    await renderApp();
    expect(screen.getAllByText("Will it rain tomorrow?").length).toBeGreaterThan(0);
  });

  test("renders empty state when no markets exist", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/markets") return { ok: true, json: async () => [] } as Response;
      if (url === "/api/leaderboard") return { ok: true, json: async () => [] } as Response;
      throw new Error(`Unexpected fetch: ${url}`);
    });
    await renderApp();
    expect(screen.queryAllByText("Will it rain tomorrow?")).toHaveLength(0);
  });

  test("renders leaderboard players", async () => {
    mockBaseFetch();
    await renderApp();
    expect(screen.getByText(/testuser/)).toBeInTheDocument();
    expect(screen.getByText(/otheruser/)).toBeInTheDocument();
  });
});
