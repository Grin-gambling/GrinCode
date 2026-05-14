import { render, screen } from "@testing-library/react";
import Leaderboard from "./Leaderboard";
import { describe, test, expect } from "vitest";

const mockUsers = [
  { id: "1", username: "Mina", acorns: 1000 },
  { id: "2", username: "Lucas", acorns: 80 },
  { id: "3", username: "Sammy", acorns: 80 },
  { id: "4", username: "Youssef", acorns: 70 },
];

describe("Leaderboard", () => {
  test("renders title", () => {
    render(<Leaderboard players={mockUsers} />);
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
  });

  test("renders all users", () => {
    render(<Leaderboard players={mockUsers} />);

    expect(screen.getByText(/mina/i)).toBeInTheDocument();
    expect(screen.getByText(/lucas/i)).toBeInTheDocument();
    expect(screen.getByText(/sammy/i)).toBeInTheDocument();
    expect(screen.getByText(/youssef/i)).toBeInTheDocument();
  });

  test("sorts users by acorns descending", () => {
    render(<Leaderboard players={mockUsers} />);

    const rows = screen.getAllByText(/acorns/);

    expect(rows[0]).toHaveTextContent("1000 acorns");
    expect(rows[1]).toHaveTextContent("80 acorns");
    expect(rows[2]).toHaveTextContent("80 acorns");
    expect(rows[3]).toHaveTextContent("70 acorns");
  });

  test("renders ranking order correctly", () => {
    render(<Leaderboard players={mockUsers} />);

    expect(screen.getByText("1. Mina")).toBeInTheDocument();
    expect(screen.getByText("2. Lucas")).toBeInTheDocument();
    expect(screen.getByText("3. Sammy")).toBeInTheDocument();
    expect(screen.getByText("4. Youssef")).toBeInTheDocument();
  });

  test("renders with no players", () => {
  render(<Leaderboard players={[]} />);

  expect(screen.getByText("Leaderboard")).toBeInTheDocument();
  });

  test("renders a single player correctly", () => {
  render(
    <Leaderboard
      players={[{ id: "1", username: "Mina", acorns: 50 }]}
    />
  );

  expect(screen.getByText("1. Mina")).toBeInTheDocument();
  expect(screen.getByText("50 acorns")).toBeInTheDocument();
  });

});