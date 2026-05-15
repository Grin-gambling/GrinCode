import { useEffect, useRef, useState, type JSX } from "react";
import "./App.css";
import banner from "./components/gambling-banner.jpg";
import Button from "./button";
import BetPostContainer from "./BetPostContainer.tsx";
import Leaderboard from "./Leaderboard";
import Currency from "./Currency";
import Login from "./Login";
import Register from "./Registration";
import TopBets from "./TopBets";

type BetPost = {
  id: string;
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
};

type AppView = "markets" | "minigames";

type MinigameMessage =
  | { type: "grin:navigate"; view: AppView }
  | { type: "grin:minigames-balance"; balance: number };

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
  status: "open" | "closed" | "resolved";
  closes_at: string;
  winning_outcome_id: string | null;
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

type LeaderboardUser = {
  id: string;
  username: string;
  balance: number | string;
};

const pillShape = true;

const cardStyle = {
  border: "4px solid #DA291C",
  padding: "15px",
  backgroundColor: "white",
  borderRadius: pillShape ? "40px" : "8px",
};

const AUTH_TOKEN_STORAGE_KEY = "grincodeAuthToken";

function toLocalDateTimeIso(localDateTimeValue: string) {
  const localDate = new Date(localDateTimeValue);

  if (Number.isNaN(localDate.getTime())) {
    return "";
  }

  return localDate.toISOString();
}

function mapMarketRowsToPosts(rows: ApiMarketRow[]): BetPost[] {
  const groupedMarkets = new Map<
    string,
    {
      id: string;
      title: string;
      content: string;
      closesAt: string;
      status: "open" | "closed" | "resolved";
      winningOutcomeId: string | null;
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
      closesAt: row.closes_at,
      status: row.status,
      winningOutcomeId: row.winning_outcome_id,
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
        closesAt: market.closesAt,
        status: market.status,
        leftOutcomeId: leftOutcome.id,
        leftLabel: leftOutcome.label,
        leftTotal: leftOutcome.totalAmount,
        rightOutcomeId: rightOutcome.id,
        rightLabel: rightOutcome.label,
        rightTotal: rightOutcome.totalAmount,
        winningOutcomeId: market.winningOutcomeId,
        upvotes: market.upvotes,
        downvotes: market.downvotes,
      };
    })
    .filter((market): market is BetPost => market !== null);
}

export default function App(): JSX.Element {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  );
  const [currentLoggedInUser, setCurrentLoggedInUser] = useState<AuthUser | null>(null);
  const [posts, setPosts] = useState<BetPost[]>([]);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLeft, setNewLeft] = useState("");
  const [newRight, setNewRight] = useState("");
  const [newCloseTime, setNewCloseTime] = useState("");
  const [startAllTimers] = useState(true);
  const [activeView, setActiveView] = useState<AppView>("markets");
  const [guestAcorns, setGuestAcorns] = useState(1000);
  const [minigameSrc, setMinigameSrc] = useState("/grin-gamblers.html");
  const minigameFrameRef = useRef<HTMLIFrameElement | null>(null);

  const backgroundColor = "#DA291C";
  const textcolor = "white";
  const fontSize = 18;
  const currentAcorns = currentLoggedInUser?.balance ?? guestAcorns;

  const [compactView, setCompactView] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    if (!authToken) {
      return {};
    }

    return {
      Authorization: `Bearer ${authToken}`,
    };
  };

  const loadMarkets = async () => {
    const response = await fetch("/api/markets");

    if (!response.ok) {
      throw new Error("Failed to load markets");
    }

    const rows: ApiMarketRow[] = await response.json();
    setPosts(mapMarketRowsToPosts(rows));
  };

  const loadCurrentUser = async () => {
    if (!authToken) {
      setCurrentLoggedInUser(null);
      return;
    }

    const response = await fetch("/api/auth/me", {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      setAuthToken(null);
      setCurrentLoggedInUser(null);
      return;
    }

    const responseBody = await response.json();
    setCurrentLoggedInUser(responseBody.user);
  };

  const loadLeaderboard = async () => {
    const response = await fetch("/api/leaderboard");

    if (!response.ok) {
      throw new Error("Failed to load leaderboard");
    }

    const rows: LeaderboardUser[] = await response.json();
    setLeaderboardUsers(rows);
  };

  const refreshAppData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      await Promise.all([loadMarkets(), loadLeaderboard()]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load app data";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const syncMinigameBalance = async (balance: number) => {
    if (!authToken) {
      return;
    }

    const response = await fetch("/api/auth/me/balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ balance }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || "Failed to sync acorns");
    }

    const responseBody = await response.json();
    setCurrentLoggedInUser(responseBody.user);
    await loadLeaderboard();
  };

  useEffect(() => {
  void refreshAppData();
}, []);

  useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setShowCreateModal(false);
      setShowLoginModal(false);
      setShowRegisterModal(false);
    }
  };

  window.addEventListener("keydown", handleEscape);

  return () => {
    window.removeEventListener("keydown", handleEscape);
  };
}, []);

  useEffect(() => {
    if (!authToken) {
      setCurrentLoggedInUser(null);
      return;
    }

    let isActive = true;

    const loadCurrentUserForEffect = async () => {
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

    void loadCurrentUserForEffect();

    return () => {
      isActive = false;
    };
  }, [authToken]);

  useEffect(() => {
    const frameWindow = minigameFrameRef.current?.contentWindow;

    if (!frameWindow) {
      return;
    }

    frameWindow.postMessage(
      {
        type: "grin:parent-balance",
        balance: currentAcorns,
      },
      window.location.origin
    );
  }, [currentAcorns, activeView]);

  useEffect(() => {
    if (activeView !== "minigames") {
      return;
    }

    setMinigameSrc(`/grin-gamblers.html?balance=${currentAcorns}`);
  }, [activeView, authToken, currentLoggedInUser?.id]);

  useEffect(() => {
    const handleMinigameMessage = (event: MessageEvent<MinigameMessage>) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === "grin:navigate") {
        setActiveView(event.data.view);
        return;
      }

      if (event.data?.type === "grin:minigames-balance") {
        const nextBalance = Math.floor(Number(event.data.balance));

        if (!Number.isFinite(nextBalance) || nextBalance < 0) {
          return;
        }

        if (nextBalance === currentAcorns) {
          return;
        }

        if (!authToken) {
          setGuestAcorns(nextBalance);
          setErrorMessage("Guest minigame acorns are local only. Log in to save them to your account.");
          return;
        }

        setCurrentLoggedInUser((currentUser) =>
          currentUser
            ? {
                ...currentUser,
                balance: nextBalance,
              }
            : currentUser
        );

        void syncMinigameBalance(nextBalance).catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : "Failed to sync acorns";
          setErrorMessage(message);
        });
      }
    };

    window.addEventListener("message", handleMinigameMessage);
    return () => window.removeEventListener("message", handleMinigameMessage);
  }, [authToken, currentAcorns]);

  const placeBet = async (
    marketId: string,
    outcomeId: string,
    amount: number
  ) => {
    if (!authToken) {
      throw new Error("Please log in to place a bet");
    }

    const response = await fetch(`/api/markets/${marketId}/bets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
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

    const wagerResponse = await response.json();
    await Promise.all([loadMarkets(), loadLeaderboard()]);

    setCurrentLoggedInUser((currentUser) =>
      currentUser
        ? {
            ...currentUser,
            balance: Number(wagerResponse.userBalance),
          }
        : currentUser
    );
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

  const resolveMarket = async (marketId: string, winningOutcomeId: string) => {
    if (!authToken) {
      throw new Error("Please log in to resolve a market");
    }

    const response = await fetch(`/api/markets/${marketId}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ winningOutcomeId }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || "Failed to resolve market");
    }

    await Promise.all([loadMarkets(), loadLeaderboard(), loadCurrentUser()]);
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
    if (!authToken) {
      setErrorMessage("Please log in to create a bet");
      setShowLoginModal(true);
      setShowCreateModal(false);
      return;
    }

    if (!newTitle || !newContent || !newLeft || !newRight || !newCloseTime) {
      return;
    }

    try {
      setErrorMessage("");
      const closesAtIso = toLocalDateTimeIso(newCloseTime);

      if (!closesAtIso) {
        throw new Error("Invalid close time");
      }

      const response = await fetch("/api/markets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          question: newTitle,
          description: newContent,
          outcome1: newLeft,
          outcome2: newRight,
          closesAt: closesAtIso,
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
      setNewCloseTime("");
      setShowCreateModal(false);

      await refreshAppData();
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
    <main aria-label="Grin Gambling application">
      <header className="banner" role="banner">
        <img src={banner} alt="Grin Gambling Website Banner" />
        <h1 aria-label="Grin Gambling">G R I N G A M B L I N G </h1>
        <Currency acorns={currentAcorns} />
      </header>
      <p className="sr-only" aria-live="polite">
        Current acorn balance: {currentAcorns}
      </p>

      <nav className="button-area" aria-label="Primary navigation">
      <div style={{ marginRight: "auto", paddingLeft: "12px" }}>
          <Button
            backgroundColor={backgroundColor}
            textColor={textcolor}
            fontSize={fontSize}
            pillShape
            onClick={() => setCompactView((current) => !current)}
          >
            {compactView ? "Switch to Full Posts" : "Switch to Compact Posts"}
          </Button>
        </div>
        <Button aria-label="Switch to market view"
          aria-pressed={activeView === "markets"}
          backgroundColor={activeView === "markets" ? "#DA291C" : "#F7BB65"}
          textColor={activeView === "markets" ? "#ffffff" : "#000000"}
          fontSize={fontSize}
          pillShape
          onClick={() => setActiveView("markets")}
        >
          Market
        </Button>

        <Button aria-label="Switch to minigames view"
          aria-pressed={activeView === "minigames"}
          backgroundColor={activeView === "minigames" ? "#DA291C" : "#F7BB65"}
          textColor={activeView === "minigames" ? "#ffffff" : "#000000"}
          fontSize={fontSize}
          pillShape
          onClick={() => setActiveView("minigames")}
        >
          Minigames
        </Button>

        {activeView === "markets" && (
          <Button aria-label="Create new betting market"
            backgroundColor={backgroundColor}
            textColor={textcolor}
            fontSize={fontSize}
            pillShape
            onClick={() => {
              if (!authToken) {
                setErrorMessage("Please log in to create a bet");
                setShowLoginModal(true);
                return;
              }

              setErrorMessage("");
              setShowCreateModal(true);
            }}
          >
            Create Bet
          </Button>
        )}

        <Button aria-label={
          currentLoggedInUser
          ? `Log out ${currentLoggedInUser.username}`
          : "Open login modal"
          }
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
          {currentLoggedInUser ? `Log Out (${currentLoggedInUser.username})` : "Login"}
        </Button>

        <Button aria-label="Sign Up"
          backgroundColor={backgroundColor}
          textColor={textcolor}
          fontSize={fontSize}
          pillShape
          onClick={() => setShowRegisterModal(true)}
        >
          Sign up
        </Button>
      </nav>

      {errorMessage && (
        <p role="alert" aria-live="assertive">
        {errorMessage}
        </p>
      )}
      {isLoading && activeView === "markets" && (
        <p aria-live="polite">
        Loading markets...
        </p>
      )}

      {activeView === "markets" ? (
        <div>
          <div style={{ display: "flex" }}>
            <section style={{ flex: 1 }} aria-label="Betting markets">
              {posts.map((post) => (
                <BetPostContainer
                  compact={compactView}
                  key={post.id}
                  backgroundColor={backgroundColor}
                  textColor={textcolor}
                  fontSize={fontSize}
                  pillShape
                  marketId={post.id}
                  title={post.title}
                  content={post.content}
                  closesAt={post.closesAt}
                  status={post.status}
                  leftOutcomeId={post.leftOutcomeId}
                  leftLabel={post.leftLabel}
                  leftTotal={post.leftTotal}
                  rightOutcomeId={post.rightOutcomeId}
                  rightLabel={post.rightLabel}
                  rightTotal={post.rightTotal}
                  winningOutcomeId={post.winningOutcomeId}
                  upvotes={post.upvotes}
                  downvotes={post.downvotes}
                  onPlaceBet={placeBet}
                  onResolveMarket={resolveMarket}
                  onVote={castVote}
                  onLoadComments={loadComments}
                  onAddComment={addComment}
                  startAllTimers={startAllTimers}
                />
              ))}
            </section>

<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    alignItems: "flex-start",
    paddingTop: "30px",
    paddingRight: "30px",
  }}
>
  <aside style={cardStyle} aria-label="Leaderboard">
    <Leaderboard
      players={leaderboardUsers.map((user) => ({
        id: user.id,
        username: user.username,
        acorns: Number(user.balance),
      }))}
    />
  </aside>

  <aside style={cardStyle} aria-label="Top Bets">
    <TopBets posts={posts} />
  </aside>
</div>
          </div>
        </div>
      ) : (
        <div className="minigame-shell">
          <div className="minigame-note">
            {currentLoggedInUser
              ? "Minigame wins and losses sync directly with your acorns."
              : "Log in first if you want your minigame acorns to save to your account."}
          </div>

          <iframe
            ref={minigameFrameRef}
            key={currentLoggedInUser?.id ?? "guest"}
            className="minigame-frame"
            src={minigameSrc}
            aria-label="Grin Gamblers minigames"
            tabIndex={0}
            title="Grin Gamblers Minigames"
            onLoad={() => {
              const frameWindow = minigameFrameRef.current?.contentWindow;

              if (!frameWindow) {
                return;
              }

              frameWindow.postMessage(
                {
                  type: "grin:parent-balance",
                  balance: currentAcorns,
                },
                window.location.origin
              );
            }}
          />
        </div>
      )}

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
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-bet-title"
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
            <h2
              id="create-bet-title"
              style={{ margin: 0 }}>
            Create Bet
            </h2>

            <label htmlFor="bet-title">Bet title</label>
            <input
              id="bet-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ padding: "8px" }}
            />

            <label htmlFor="bet-description">Bet description</label>
            <input
              id="bet-description"
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              style={{ padding: "8px" }}
            />

            <label htmlFor="left-option">Left option</label>
            <input
              id="left-option"
              type="text"
              value={newLeft}
              onChange={(e) => setNewLeft(e.target.value)}
              style={{ padding: "8px" }}
            />

            <label htmlFor="right-option">Right option</label>
            <input
              id="right-option"
              type="text"
              value={newRight}
              onChange={(e) => setNewRight(e.target.value)}
              style={{ padding: "8px" }}
            />

            <label htmlFor="bet-close-time">
              Closing date and time
            </label>

            <input
              id="bet-close-time"
              type="datetime-local"
              value={newCloseTime}
              onChange={(e) => setNewCloseTime(e.target.value)}
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            onClick={(e) => e.stopPropagation()}>
            <h2
              id="login-modal-title"
              style={{ margin: 0 }}>
              Login
            </h2>

            <Login
              backgroundColor="white"
              textColor={textcolor}
              fontSize={fontSize}
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              autoFocus
              onLoginSuccess={(token, user) => {
                localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
                setAuthToken(token);
                setCurrentLoggedInUser(user);
                setShowLoginModal(false);
                void refreshAppData();
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-modal-title"
            onClick={(e) => e.stopPropagation()}>
            <h2
              id="register-modal-title"
              style={{ margin: 0 }}>
              Register
            </h2>

            <Register
              backgroundColor="white"
              textColor={textcolor}
              fontSize={fontSize}
              isOpen={showRegisterModal}
              onClose={() => setShowRegisterModal(false)}
              autoFocus
              onRegisterSuccess={(token, user) => {
                localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
                setAuthToken(token);
                setCurrentLoggedInUser(user);
                setShowRegisterModal(false);
                void refreshAppData();
              }}  
            />
          </div>
        </div>
      )}
    </main>
  );
}
