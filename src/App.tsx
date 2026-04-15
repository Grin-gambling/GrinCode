import { useEffect, useState } from "react";
import './App.css'
import banner from "./components/gambling-banner.jpg";
import Button from './button';
import Post from './betPost';

type BetPost = {
  id: string;
  title: string;
  content: string;
  leftOutcomeId: string;
  leftLabel: string;
  leftTotal: number;
  rightOutcomeId: string;
  rightLabel: string;
  rightTotal: number;
};

type ApiMarketRow = {
  id: string;
  question: string;
  description: string;
  outcome_id: string;
  label: string;
  total_amount: number | string;
};

function mapMarketRowsToPosts(rows: ApiMarketRow[]): BetPost[] {
  const groupedMarkets = new Map<
    string,
    {
      id: string;
      title: string;
      content: string;
      outcomes: Array<{
        id: string;
        label: string;
        totalAmount: number;
      }>;
    }
  >();

  for (const row of rows) {
    const existingMarket = groupedMarkets.get(row.id);

    if (existingMarket) {
      existingMarket.outcomes.push({
        id: row.outcome_id,
        label: row.label,
        totalAmount: Number(row.total_amount),
      });
      continue;
    }

    groupedMarkets.set(row.id, {
      id: row.id,
      title: row.question,
      content: row.description,
      outcomes: [
        {
          id: row.outcome_id,
          label: row.label,
          totalAmount: Number(row.total_amount),
        },
      ],
    });
  }

  return Array.from(groupedMarkets.values())
    .map((market) => {
      if (market.outcomes.length < 2) {
        return null;
      }

      const [leftOutcome, rightOutcome] = market.outcomes;

      return {
        id: market.id,
        title: market.title,
        content: market.content,
        leftOutcomeId: leftOutcome.id,
        leftLabel: leftOutcome.label,
        leftTotal: leftOutcome.totalAmount,
        rightOutcomeId: rightOutcome.id,
        rightLabel: rightOutcome.label,
        rightTotal: rightOutcome.totalAmount,
      };
    })
    .filter((market): market is BetPost => market !== null);
}

export default function App() {
  const backgroundColor = "#DA291C";
  const textcolor = "white";
  const fontSize = 18;

  const [posts, setPosts] = useState<BetPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLeft, setNewLeft] = useState("");
  const [newRight, setNewRight] = useState("");

  const [startAllTimers, setStartAllTimers] = useState(false);

  const loadMarkets = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/markets");

      if (!response.ok) {
        throw new Error("Failed to load markets");
      }

      const rows: ApiMarketRow[] = await response.json();
      setPosts(mapMarketRowsToPosts(rows));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load markets";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMarkets();
  }, []);

  const placeBet = async (
    marketId: string,
    outcomeId: string,
    amount: number
  ) => {
    const response = await fetch(`/api/markets/${marketId}/bets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        outcomeId,
        amount,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || "Failed to place bet");
    }

    await loadMarkets();
  };

  const handleCreatePost = async () => {
    if (!newTitle || !newContent || !newLeft || !newRight) return;

    try {
      setErrorMessage("");

      const response = await fetch("/api/markets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: newTitle,
          description: newContent,
          outcome1: newLeft,
          outcome2: newRight,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "Failed to create market");
      }

      setNewTitle("");
      setNewContent("");
      setNewLeft("");
      setNewRight("");
      setShowCreateModal(false);

      await loadMarkets();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create market";
      setErrorMessage(message);
    }
  };

  return (
    <div>
      <div className="banner">
        <img
          src={banner}
          alt="Website Banner"
        />
        <h1>G R I N G A M B L I N G</h1>
      </div>

      <div className="button-area">
        <Button
          backgroundColor={backgroundColor}
          textColor={textcolor}
          fontSize={fontSize}
          pillShape
          onClick={() => setShowCreateModal(true)}
        >
          Create Bet
        </Button>
      </div>


      <div className="button-area">
        <Button
          backgroundColor="#000000"
          textColor={textcolor}
          fontSize={fontSize}
          pillShape
          width="150px"
          onClick={() => setStartAllTimers(true)}
        >
          Pass Time
        </Button>
      </div>


      <p>Tuition doesn't gamble away itself Grinnellians do har har</p>

      {errorMessage && <p>{errorMessage}</p>}
      {isLoading && <p>Loading markets...</p>}

      <div>
        {posts.map((post) => (
          <Post
            key={post.id}
            backgroundColor={backgroundColor}
            textColor={textcolor}
            fontSize={fontSize}
            pillShape
            marketId={post.id}
            title={post.title}
            content={post.content}
            leftOutcomeId={post.leftOutcomeId}
            leftLabel={post.leftLabel}
            leftTotal={post.leftTotal}
            rightOutcomeId={post.rightOutcomeId}
            rightLabel={post.rightLabel}
            rightTotal={post.rightTotal}
            onPlaceBet={placeBet}
            startAllTimers={startAllTimers}
          />
        ))}
      </div>

      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "600px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <h2 style={{ margin: 0 }}>Create Bet</h2>

            <input
              type="text"
              placeholder="Bet title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ padding: "8px" }}
            />

            <input
              type="text"
              placeholder="Bet description"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              style={{ padding: "8px" }}
            />

            <input
              type="text"
              placeholder="Left option"
              value={newLeft}
              onChange={(e) => setNewLeft(e.target.value)}
              style={{ padding: "8px" }}
            />

            <input
              type="text"
              placeholder="Right option"
              value={newRight}
              onChange={(e) => setNewRight(e.target.value)}
              style={{ padding: "8px" }}
            />

            <Button
              backgroundColor={backgroundColor}
              textColor={textcolor}
              fontSize={fontSize}
              pillShape
              onClick={handleCreatePost}
            >
              Create Bet
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
