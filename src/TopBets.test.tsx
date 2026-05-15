import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import TopBets from "./TopBets";

describe("TopBets", () => {
  test("shows an empty state when there are no posts", () => {
    render(<TopBets posts={[]} />);

    expect(screen.getByText("Top Bets")).toBeInTheDocument();
    expect(screen.getByText("No bets yet")).toBeInTheDocument();
  });

  test("sorts posts by total pool size and limits the list to five", () => {
    render(
      <TopBets
        posts={[
          { id: "1", title: "A", leftLabel: "Yes", rightLabel: "No", leftTotal: 3, rightTotal: 2 },
          { id: "2", title: "B", leftLabel: "Yes", rightLabel: "No", leftTotal: 20, rightTotal: 10 },
          { id: "3", title: "C", leftLabel: "Yes", rightLabel: "No", leftTotal: 1, rightTotal: 1 },
          { id: "4", title: "D", leftLabel: "Yes", rightLabel: "No", leftTotal: 15, rightTotal: 10 },
          { id: "5", title: "E", leftLabel: "Yes", rightLabel: "No", leftTotal: 9, rightTotal: 9 },
          { id: "6", title: "F", leftLabel: "Yes", rightLabel: "No", leftTotal: 8, rightTotal: 8 },
        ]}
      />
    );

    const titles = screen.getAllByText(/^[A-F]$/).map((node) => node.textContent);
    expect(titles).toEqual(["B", "D", "E", "F", "A"]);
    expect(screen.queryByText("C")).not.toBeInTheDocument();
    expect(screen.getByText("Pool: 30 acorns")).toBeInTheDocument();
  });

  test("filters out posts with invalid totals", () => {
    render(
      <TopBets
        posts={[
          { id: "1", title: "Valid", leftLabel: "Yes", rightLabel: "No", leftTotal: 4, rightTotal: 6 },
          {
            id: "2",
            title: "Invalid",
            leftLabel: "Yes",
            rightLabel: "No",
            leftTotal: "oops" as unknown as number,
            rightTotal: 5,
          },
        ]}
      />
    );

    expect(screen.getByText("Valid")).toBeInTheDocument();
    expect(screen.queryByText("Invalid")).not.toBeInTheDocument();
  });
});
