import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Post from "./betPost";

function renderPost(overrides: Partial<ComponentProps<typeof Post>> = {}) {
  const props: ComponentProps<typeof Post> = {
    marketId: "market-1",
    backgroundColor: "#DA291C",
    textColor: "#ffffff",
    fontSize: 18,
    pillShape: true,
    title: "Will it rain tomorrow?",
    content: "Weather market",
    closesAt: "2099-01-01T00:00:00.000Z",
    status: "open",
    leftOutcomeId: "outcome-yes",
    leftLabel: "Yes",
    leftTotal: 10,
    rightOutcomeId: "outcome-no",
    rightLabel: "No",
    rightTotal: 20,
    winningOutcomeId: null,
    upvotes: 3,
    downvotes: 1,
    onPlaceBet: vi.fn().mockResolvedValue(undefined),
    onResolveMarket: vi.fn().mockResolvedValue(undefined),
    onVote: vi.fn().mockResolvedValue(undefined),
    onLoadComments: vi.fn().mockResolvedValue([]),
    onAddComment: vi.fn().mockResolvedValue({
      id: "comment-1",
      market_id: "market-1",
      body: "hello",
      created_at: "2026-05-14T00:00:00.000Z",
    }),
    startAllTimers: true,
    ...overrides,
  };

  return {
    ...render(<Post {...props} />),
    props,
  };
}

describe("Post interactions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("loads and displays comments when the user opens the comments section", async () => {
    const { props } = renderPost({
      onLoadComments: vi.fn().mockResolvedValue([
        {
          id: "comment-1",
          market_id: "market-1",
          body: "First comment",
          created_at: "2026-05-14T00:00:00.000Z",
        },
      ]),
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /show comments/i }));

    expect(await screen.findByText("Comment: First comment")).toBeInTheDocument();
    expect(props.onLoadComments).toHaveBeenCalledWith("market-1");
  });

  test("surfaces comment loading failures", async () => {
    renderPost({
      onLoadComments: vi.fn().mockRejectedValue(new Error("Comments broke")),
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /show comments/i }));

    expect(await screen.findByText("Comments broke")).toBeInTheDocument();
  });

  test("allows posting a comment from the comments panel", async () => {
    const onAddComment = vi.fn().mockResolvedValue({
      id: "comment-2",
      market_id: "market-1",
      body: "New comment",
      created_at: "2026-05-14T00:00:00.000Z",
    });
    renderPost({ onAddComment });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /show comments/i }));
    await user.type(screen.getByPlaceholderText(/write a comment/i), "New comment");
    await user.click(screen.getByRole("button", { name: /^post$/i }));

    expect(onAddComment).toHaveBeenCalledWith("market-1", "New comment");
    expect(await screen.findByText("Comment: New comment")).toBeInTheDocument();
  });

  test("shows a bet error when the wager request fails", async () => {
    const onPlaceBet = vi.fn().mockRejectedValue(new Error("Not enough acorns"));
    renderPost({ onPlaceBet });
    const user = userEvent.setup();

    await user.click(screen.getAllByText("33.3%")[0]);
    await user.clear(screen.getByPlaceholderText(/enter acorns for yes/i));
    await user.type(screen.getByPlaceholderText(/enter acorns for yes/i), "15");
    await user.click(screen.getByRole("button", { name: /place 15 acorn bet/i }));

    expect(await screen.findByText("Not enough acorns")).toBeInTheDocument();
  });

  test("submits a bet for the selected side and closes the modal on success", async () => {
    const onPlaceBet = vi.fn().mockResolvedValue(undefined);
    renderPost({ onPlaceBet });
    const user = userEvent.setup();

    await user.click(screen.getAllByText("66.7%")[0]);
    await user.clear(screen.getByPlaceholderText(/enter acorns for no/i));
    await user.type(screen.getByPlaceholderText(/enter acorns for no/i), "12");
    await user.click(screen.getByRole("button", { name: /place 12 acorn bet/i }));

    await waitFor(() => {
      expect(onPlaceBet).toHaveBeenCalledWith("market-1", "outcome-no", 12);
    });
    expect(screen.queryByPlaceholderText(/enter acorns for no/i)).not.toBeInTheDocument();
  });

  test("shows a vote error when voting fails", async () => {
    renderPost({
      onVote: vi.fn().mockRejectedValue(new Error("You have already voted on this market")),
    });
    const user = userEvent.setup();

    await user.click(screen.getAllByRole("button")[0]);

    expect(
      await screen.findByText("You have already voted on this market")
    ).toBeInTheDocument();
  });

  test("shows the resolved winner label for resolved markets", () => {
    renderPost({
      status: "resolved",
      winningOutcomeId: "outcome-no",
    });

    expect(screen.getByText("Resolved winner: No")).toBeInTheDocument();
  });
});
