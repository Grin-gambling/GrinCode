import { render, screen } from "@testing-library/react";
import Leaderboard from "./Leaderboard";
import { describe, test, expect } from "vitest";

const mockUsers = [
  {
    id: "1",
    username: "Mina",
    acorns: 1000,
  },
  {
    id: "2",
    username: "Lucas",
    acorns: 80,
  },
  {
    id: "3",
    username: "Sammy",
    acorns: 80,
  },
  {
    id: "4",
    username: "Youssef",
    acorns: 70,
  },
];

describe("Leaderboard", () => {
  test("renders title", () => {
    render(<Leaderboard players={mockUsers} />);

    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
  });
});