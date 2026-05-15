// TopBets.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import TopBets from "./TopBets";

describe("TopBets component", () => {
  const mockPosts = [
    {
      id: "1",
      title: "Post One",
      leftLabel: "Yes",
      rightLabel: "No",
      leftTotal: 50,
      rightTotal: 25,
    },
    {
      id: "2",
      title: "Post Two",
      leftLabel: "Cats",
      rightLabel: "Dogs",
      leftTotal: 100,
      rightTotal: 100,
    },
    {
      id: "3",
      title: "Post Three",
      leftLabel: "A",
      rightLabel: "B",
      leftTotal: 10,
      rightTotal: 5,
    },
  ];

  test("renders Top Bets title", () => {
    render(<TopBets posts={[]} />);

    expect(screen.getByText("Top Bets")).toBeInTheDocument();
  });

  test("renders 'No bets yet' when posts array is empty", () => {
    render(<TopBets posts={[]} />);

    expect(screen.getByText("No bets yet")).toBeInTheDocument();
  });

  test("renders posts correctly", () => {
    render(<TopBets posts={mockPosts} />);

    expect(screen.getByText("Post One")).toBeInTheDocument();
    expect(screen.getByText("Post Two")).toBeInTheDocument();
    expect(screen.getByText("Post Three")).toBeInTheDocument();
  });

  test("calculates and displays total pool correctly", () => {
    render(<TopBets posts={mockPosts} />);

    expect(
      screen.getByText("Pool: 75 acorns")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Pool: 200 acorns")
    ).toBeInTheDocument();
  });

  test("sorts posts by total acorns descending", () => {
    render(<TopBets posts={mockPosts} />);

    const titles = screen.getAllByText(/Post/);

    expect(titles[0]).toHaveTextContent("Post Two");
    expect(titles[1]).toHaveTextContent("Post One");
    expect(titles[2]).toHaveTextContent("Post Three");
  });

  test("limits displayed posts to top 5", () => {
    const manyPosts = Array.from({ length: 7 }, (_, i) => ({
      id: `${i}`,
      title: `Post ${i}`,
      leftLabel: "Left",
      rightLabel: "Right",
      leftTotal: i * 10,
      rightTotal: i * 10,
    }));

    render(<TopBets posts={manyPosts} />);

    const renderedTitles = screen.getAllByText(/Post/);

    expect(renderedTitles.length).toBe(5);
  });

  test("filters out invalid posts with non-number totals", () => {
    const invalidPosts = [
      ...mockPosts,
      {
        id: "4",
        title: "Invalid Post",
        leftLabel: "Bad",
        rightLabel: "Data",
        leftTotal: "100" as unknown as number,
        rightTotal: 50,
      },
    ];

    render(<TopBets posts={invalidPosts} />);

    expect(
      screen.queryByText("Invalid Post")
    ).not.toBeInTheDocument();
  });

  test("handles undefined posts prop safely", () => {
    render(<TopBets posts={undefined as any} />);

    expect(screen.getByText("No bets yet")).toBeInTheDocument();
  });

  test("renders left and right labels with totals", () => {
    render(<TopBets posts={mockPosts} />);

    expect(
      screen.getByText("Yes: 50 | No: 25")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Cats: 100 | Dogs: 100")
    ).toBeInTheDocument();
  });
});