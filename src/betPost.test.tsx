import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import Post from "./betPost";

describe("Post resolve controls", () => {
  test("does not show resolve buttons to a normal market viewer when a market closes", () => {
    render(
      <Post
        marketId="market-1"
        backgroundColor="#DA291C"
        textColor="#ffffff"
        fontSize={18}
        pillShape
        title="Will it rain tomorrow?"
        content="Weather market"
        closesAt="2000-01-01T00:00:00.000Z"
        status="closed"
        leftOutcomeId="outcome-yes"
        leftLabel="Yes"
        leftTotal={10}
        rightOutcomeId="outcome-no"
        rightLabel="No"
        rightTotal={20}
        winningOutcomeId={null}
        upvotes={3}
        downvotes={1}
        onPlaceBet={vi.fn().mockResolvedValue(undefined)}
        onResolveMarket={vi.fn().mockResolvedValue(undefined)}
        onVote={vi.fn().mockResolvedValue(undefined)}
        onLoadComments={vi.fn().mockResolvedValue([])}
        onAddComment={vi.fn().mockResolvedValue({
          id: "comment-1",
          market_id: "market-1",
          body: "hello",
          created_at: "2026-05-14T00:00:00.000Z",
        })}
        startAllTimers
      />
    );

    expect(
      screen.queryByRole("button", { name: /resolve yes/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /resolve no/i })
    ).not.toBeInTheDocument();
  });
});
