import { useEffect, useState, type JSX } from "react";
import "./App.css";
import banner from "./components/gambling-banner.jpg";
import Button from "./button";
import Post from "./betPost";
import Leaderboard from "./Leaderboard";
import Currency from "./Currency";
import Login from "./Login";
import Register from "./Registration";

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
  upvotes: number;
  downvotes: number;
};

export type MarketComment = {
  id: string;
  market_id: string;
  body: string;
  created_at: string;
};

type ApiMarketRow = {
  id: string;
  question: string;
  description: string;
  outcome_id: string;
  label: string;
  total_amount: number | string;
  total_upvotes: number | string;
  total_downvotes: number | string;
};

type AuthUser = {
  id: string;
  username: string;
  email: string;
  balance: number;
  created_at: string;
};

const AUTH_TOKEN_STORAGE_KEY = "grincodeAuthToken";

function mapMarketRowsToPosts(rows: ApiMarketRow[]): BetPost[] {
  const groupedMarkets = new Map<
    string,
    {
      id: string;
      title: string;
      content: string;
      upvotes: number;
      downvotes: number;
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
      upvotes: Number(row.total_upvotes),
      downvotes: Number(row.total_downvotes),
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
        upvotes: market.upvotes,
        downvotes: market.downvotes,
      };
    })
    .filter((market): market is BetPost => market !== null);
}

const fakePlayers = [
  { id: "1", name: "Mina", balance: 1000 },
  { id: "2", name: "Lucas", balance: 0 },
  { id: "3", name: "Sam", balance: 0 },
  { id: "4", name: "Youssef", balance: 0 },
];

export default function App(): JSX.Element {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  );
  const [currentLoggedInUser, setCurrentLoggedInUser] = useState<AuthUser | null>(null);

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

  const [startAllTimers] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    if (!authToken) {
      return {};
    }

    return {
      Authorization: `Bearer ${authToken}`,
    };
  };

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

  useEffect(() => {
    if (!authToken) {
      setCurrentLoggedInUser(null);
      return;
    }

    let isActive = true;

    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

          if (isActive) {
            setAuthToken(null);
            setCurrentLoggedInUser(null);
          }
          return;
        }

        const responseBody = await response.json();

        if (isActive) {
          setCurrentLoggedInUser(responseBody.user);
        }
      } catch {
        if (isActive) {
          setCurrentLoggedInUser(null);
        }
      }
    };

    void loadCurrentUser();

    return () => {
      isActive = false;
    };
  }, [authToken]);

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

  const castVote = async (marketId: string, voteType: "up" | "down") => {
    if (!authToken) {
      throw new Error("Please log in to vote");
    }

    const response = await fetch(`/api/markets/${marketId}/votes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ voteType }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || "Failed to submit vote");
    }

    await loadMarkets();
  };

  const loadComments = async (marketId: string): Promise<MarketComment[]> => {
    const response = await fetch(`/api/markets/${marketId}/comments`);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || "Failed to load comments");
    }

    return response.json();
  };

  const addComment = async (
    marketId: string,
    body: string
  ): Promise<MarketComment> => {
    const response = await fetch(`/api/markets/${marketId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || "Failed to post comment");
    }

    return response.json();
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

  const handleLogout = () => {
    if (!authToken) {
      setCurrentLoggedInUser(null);
      return;
    }

    void fetch("/api/auth/logout", {
      method: "POST",
      headers: getAuthHeaders(),
    }).finally(() => {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      setAuthToken(null);
      setCurrentLoggedInUser(null);
    });
  };

  return (
    <div>
      <div className="banner">
        <img src={banner} alt="Website Banner" />
        <h1>G R I N G A M B L I N G</h1>
        <Currency balance={currentLoggedInUser?.balance ?? 0} />
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

        <Button
          backgroundColor={backgroundColor}
          textColor={textcolor}
          fontSize={fontSize}
          pillShape
          onClick={() => {
            if (currentLoggedInUser) {
              handleLogout();
            } else {
              setShowLoginModal(true);
            }
          }}
        >
          {currentLoggedInUser ? `Log out (${currentLoggedInUser.username})` : "Log in"}
        </Button>

        <Button
          backgroundColor={backgroundColor}
          textColor={textcolor}
          fontSize={fontSize}
          pillShape
          onClick={() => setShowRegisterModal(true)}
        >
          Sign up
        </Button>
      </div>

      {errorMessage && <p>{errorMessage}</p>}
      {isLoading && <p>Loading markets...</p>}

      <div>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1 }}>
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
                upvotes={post.upvotes}
                downvotes={post.downvotes}
                onPlaceBet={placeBet}
                onVote={castVote}
                onLoadComments={loadComments}
                onAddComment={addComment}
                startAllTimers={startAllTimers}
              />
            ))}
          </div>

          <div
            style={{
              width: "250px",
              border: "4px solid #DA291C",
              padding: "15px",
              borderRadius: "8px",
              marginLeft: "10px",
              marginTop: "20px",
              marginRight: "20px",
            }}
          >
            <Leaderboard players={fakePlayers} />
          </div>
        </div>
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
              border: "4px solid #DA291C",
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

      {showLoginModal && (
        <div
          onClick={() => setShowLoginModal(false)}
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
          <div onClick={(e) => e.stopPropagation()}>
            <Login
              backgroundColor="white"
              textColor={textcolor}
              fontSize={fontSize}
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              onLoginSuccess={(token, user) => {
                localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
                setAuthToken(token);
                setCurrentLoggedInUser(user);
                setShowLoginModal(false);
              }}
            />
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div
          onClick={() => setShowRegisterModal(false)}
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
          <div onClick={(e) => e.stopPropagation()}>
            <Register
              backgroundColor="white"
              textColor={textcolor}
              fontSize={fontSize}
              isOpen={showRegisterModal}
              onClose={() => setShowRegisterModal(false)}
              onRegisterSuccess={(token, user) => {
                localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
                setAuthToken(token);
                setCurrentLoggedInUser(user);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
