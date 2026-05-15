import type { MarketComment } from "./App";

export type SharedPostProps = {
  marketId: string;

  backgroundColor: string;
  textColor: string;
  fontSize: number;

  pillShape?: boolean;
  betBarColor?: string;

  title: string;
  content: string;

  closesAt: string;

  status: "open" | "closed" | "resolved";

  leftOutcomeId: string;
  leftLabel: string;
  leftTotal: number;

  rightOutcomeId: string;
  rightLabel: string;
  rightTotal: number;

  winningOutcomeId: string | null;

  upvotes: number;
  downvotes: number;

  onPlaceBet: (
    marketId: string,
    outcomeId: string,
    amount: number
  ) => Promise<void>;

  onResolveMarket: (
    marketId: string,
    winningOutcomeId: string
  ) => Promise<void>;

  onVote: (
    marketId: string,
    voteType: "up" | "down"
  ) => Promise<void>;

  onLoadComments: (
    marketId: string
  ) => Promise<MarketComment[]>;

  onAddComment: (
    marketId: string,
    body: string
  ) => Promise<MarketComment>;

  startAllTimers: boolean;
};
