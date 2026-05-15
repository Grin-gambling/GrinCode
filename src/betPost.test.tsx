import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import Post from "./betPost";

const defaultProps = {
  marketId: "market-1",
  backgroundColor: "#DA291C",
  textColor: "#ffffff",
  fontSize: 18,
  pillShape: true,
  title: "Will it rain tomorrow?",
  content: "Weather market",
  closesAt: "2099-01-01T00:00:00.000Z",
  status: "open" as const,
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
};

describe("Post component", () => {
  test("renders title and content", () => {
    render(<Post {...defaultProps} />);

    expect(
      screen.getByText("Will it rain tomorrow?")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Weather market")
    ).toBeInTheDocument();
  });

  test("shows percentages correctly", () => {
    render(<Post {...defaultProps} />);

    expect(screen.getByText("Yes: 33.3%"))
      .toBeInTheDocument();

    expect(screen.getByText("No: 66.7%"))
      .toBeInTheDocument();
  });

  test("opens comments section", async () => {
    const user = userEvent.setup();

    render(<Post {...defaultProps} />);

    await user.click(
      screen.getByRole("button", {
        name: /show comments/i,
      })
    );

    expect(
      screen.getByPlaceholderText(/write a comment/i)
    ).toBeInTheDocument();
  });

  test("loads comments when comments section opens", async () => {
    const onLoadComments = vi.fn().mockResolvedValue([
      {
        id: "1",
        body: "Test comment",
      },
    ]);

    const user = userEvent.setup();

    render(
      <Post
        {...defaultProps}
        onLoadComments={onLoadComments}
      />
    );

    await user.click(
      screen.getByRole("button", {
        name: /show comments/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/test comment/i)
      ).toBeInTheDocument();
    });
  });

  test("submits a comment", async () => {
    const user = userEvent.setup();

    const onAddComment = vi.fn().mockResolvedValue({
      id: "1",
      body: "New comment",
    });

    render(
      <Post
        {...defaultProps}
        onAddComment={onAddComment}
      />
    );

    await user.click(
      screen.getByRole("button", {
        name: /show comments/i,
      })
    );

    const input = screen.getByPlaceholderText(
      /write a comment/i
    );

    await user.type(input, "New comment");

    await user.click(
      screen.getByRole("button", {
        name: /^post$/i,
      })
    );

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalled();
    });
  });

  test("calls upvote handler", async () => {
    const user = userEvent.setup();

    const onVote = vi.fn().mockResolvedValue(undefined);

    render(
      <Post
        {...defaultProps}
        onVote={onVote}
      />
    );

    const buttons = screen.getAllByRole("button");

    await user.click(buttons[0]);

    await waitFor(() => {
      expect(onVote).toHaveBeenCalledWith(
        "market-1",
        "up"
      );
    });
  });

  test("opens betting modal when clicking betting bar", async () => {
    const user = userEvent.setup();

    render(<Post {...defaultProps} />);

    await user.click(screen.getAllByText("33.3%")[0]);

    expect(
      screen.getByPlaceholderText(/enter acorns/i)
    ).toBeInTheDocument();
  });

  test("places a bet successfully", async () => {
    const user = userEvent.setup();

    const onPlaceBet = vi.fn().mockResolvedValue(undefined);

    render(
      <Post
        {...defaultProps}
        onPlaceBet={onPlaceBet}
      />
    );

    await user.click(screen.getAllByText("33.3%")[0]);

    const input = screen.getByPlaceholderText(
      /enter acorns/i
    );

    await user.type(input, "25");

    await user.click(
      screen.getByRole("button", {
        name: /place 25 acorn bet/i,
      })
    );

    await waitFor(() => {
      expect(onPlaceBet).toHaveBeenCalledWith(
        "market-1",
        "outcome-yes",
        25
      );
    });
  });

  test("shows resolved winner", () => {
    render(
      <Post
        {...defaultProps}
        status="resolved"
        winningOutcomeId="outcome-yes"
      />
    );

    expect(
      screen.getByText(/resolved winner: yes/i)
    ).toBeInTheDocument();
  });

  test("shows report popup", async () => {
    const user = userEvent.setup();

    render(<Post {...defaultProps} />);

    await user.click(
      screen.getByRole("button", {
        name: /report/i,
      })
    );

    expect(
      screen.getByText(/highly trained monkeys/i)
    ).toBeInTheDocument();
  });
});

test("shows vote error if voting fails", async () => {
  const user = userEvent.setup();

  const onVote = vi
    .fn()
    .mockRejectedValue(new Error("Vote failed"));

  render(
    <Post
      {...defaultProps}
      onVote={onVote}
    />
  );

  const buttons = screen.getAllByRole("button");

  await user.click(buttons[0]);

  await waitFor(() => {
    expect(
      screen.getByText(/vote failed/i)
    ).toBeInTheDocument();
  });
});

test("shows comment loading failure", async () => {
  const user = userEvent.setup();

  const onLoadComments = vi
    .fn()
    .mockRejectedValue(new Error("Could not load"));

  render(
    <Post
      {...defaultProps}
      onLoadComments={onLoadComments}
    />
  );

  await user.click(
    screen.getByRole("button", {
      name: /show comments/i,
    })
  );

  await waitFor(() => {
    expect(
      screen.getByText(/could not load/i)
    ).toBeInTheDocument();
  });
});

test("shows comment submission failure", async () => {
  const user = userEvent.setup();

  const onAddComment = vi
    .fn()
    .mockRejectedValue(new Error("Comment failed"));

  render(
    <Post
      {...defaultProps}
      onAddComment={onAddComment}
    />
  );

  await user.click(
    screen.getByRole("button", {
      name: /show comments/i,
    })
  );

  const input = screen.getByPlaceholderText(
    /write a comment/i
  );

  await user.type(input, "Hello");

  await user.click(
    screen.getByRole("button", {
      name: /^post$/i,
    })
  );

  await waitFor(() => {
    expect(
      screen.getByText(/comment failed/i)
    ).toBeInTheDocument();
  });
});

test("shows betting error if placing bet fails", async () => {
  const user = userEvent.setup();

  const onPlaceBet = vi
    .fn()
    .mockRejectedValue(new Error("Bet failed"));

  render(
    <Post
      {...defaultProps}
      onPlaceBet={onPlaceBet}
    />
  );

  await user.click(screen.getAllByText("33.3%")[0]);

  const input = screen.getByPlaceholderText(
    /enter acorns/i
  );

  await user.type(input, "50");

  await user.click(
    screen.getByRole("button", {
      name: /place 50 acorn bet/i,
    })
  );

  await waitFor(() => {
    expect(
      screen.getByText(/bet failed/i)
    ).toBeInTheDocument();
  });
});

test("does not submit empty comment", async () => {
  const user = userEvent.setup();

  const onAddComment = vi.fn();

  render(
    <Post
      {...defaultProps}
      onAddComment={onAddComment}
    />
  );

  await user.click(
    screen.getByRole("button", {
      name: /show comments/i,
    })
  );

  await user.click(
    screen.getByRole("button", {
      name: /^post$/i,
    })
  );

  expect(onAddComment).not.toHaveBeenCalled();
});

test("does not place bet with invalid wager", async () => {
  const user = userEvent.setup();

  const onPlaceBet = vi.fn();

  render(
    <Post
      {...defaultProps}
      onPlaceBet={onPlaceBet}
    />
  );

  await user.click(screen.getAllByText("33.3%")[0]);

  await user.click(
    screen.getByRole("button", {
      name: /place 0 acorn bet/i,
    })
  );

  expect(onPlaceBet).not.toHaveBeenCalled();
});

test("shows no comments message", async () => {
  const user = userEvent.setup();

  render(<Post {...defaultProps} />);

  await user.click(
    screen.getByRole("button", {
      name: /show comments/i,
    })
  );

  await waitFor(() => {
    expect(
      screen.getByText(/no comments yet/i)
    ).toBeInTheDocument();
  });
});

test("closes betting modal when clicking overlay", async () => {
  const user = userEvent.setup();

  render(<Post {...defaultProps} />);

  await user.click(screen.getAllByText("33.3%")[0]);

  expect(
    screen.getByPlaceholderText(/enter acorns/i)
  ).toBeInTheDocument();

  // Click the dark overlay background
  const overlay = screen
    .getByPlaceholderText(/enter acorns/i)
    .closest("div")?.parentElement;

  expect(overlay).toBeTruthy();

  await user.click(overlay!);

  await waitFor(() => {
    expect(
      screen.queryByPlaceholderText(/enter acorns/i)
    ).not.toBeInTheDocument();
  });
});