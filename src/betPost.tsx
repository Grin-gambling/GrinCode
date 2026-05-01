import { useEffect, useRef, useState } from "react";
import type { MarketComment } from "./App";
import Button from "./button";

type PostProps = {
  marketId: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  pillShape?: boolean;
  title: string;
  content: string;
  betBarColor?: string;
  leftOutcomeId: string;
  leftLabel: string;
  leftTotal: number;
  rightOutcomeId: string;
  rightLabel: string;
  rightTotal: number;
  upvotes: number;
  downvotes: number;
  onPlaceBet: (
    marketId: string,
    outcomeId: string,
    amount: number
  ) => Promise<void>;
  onVote: (marketId: string, voteType: "up" | "down") => Promise<void>;
  onLoadComments: (marketId: string) => Promise<MarketComment[]>;
  onAddComment: (marketId: string, body: string) => Promise<MarketComment>;
  startAllTimers: boolean;
};

export default function Post({
  marketId,
  backgroundColor,
  textColor,
  fontSize,
  pillShape,
  title,
  content,
  betBarColor,
  leftOutcomeId,
  leftLabel,
  leftTotal,
  rightOutcomeId,
  rightLabel,
  rightTotal,
  upvotes,
  downvotes,
  onPlaceBet,
  onVote,
  onLoadComments,
  onAddComment,
  startAllTimers,
}: PostProps) {
  const [showComments, setShowComments] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [timerStarted, setTimerStarted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSide, setSelectedSide] = useState<"yes" | "no" | null>(null);
  const [wagerAmount, setWagerAmount] = useState<number | "">("");
  const [betError, setBetError] = useState("");
  const [isSubmittingBet, setIsSubmittingBet] = useState(false);
  const [comments, setComments] = useState<MarketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal && selectedSide && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showModal, selectedSide]);

  useEffect(() => {
    if (startAllTimers) {
      setTimerStarted(true);
    }
  }, [startAllTimers]);

  useEffect(() => {
    if (!timerStarted) return;

    if (timeLeft <= 0) {
      if (!hasEnded) {
        setShowPopup(true);
        setHasEnded(true);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((currentTime) => currentTime - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted, timeLeft, hasEnded]);

  useEffect(() => {
    if (!showComments || hasLoadedComments) {
      return;
    }

    let isActive = true;

    const fetchComments = async () => {
      setCommentError("");
      setIsLoadingComments(true);

      try {
        const loadedComments = await onLoadComments(marketId);

        if (isActive) {
          setComments(loadedComments);
          setHasLoadedComments(true);
        }
      } catch (error) {
        if (isActive) {
          setCommentError(
            error instanceof Error ? error.message : "Failed to load comments"
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingComments(false);
        }
      }
    };

    void fetchComments();

    return () => {
      isActive = false;
    };
  }, [showComments, hasLoadedComments, marketId, onLoadComments]);

  const selectedLabel =
    selectedSide === "yes"
      ? leftLabel
      : selectedSide === "no"
        ? rightLabel
        : "";

  const yesTotal = leftTotal;
  const noTotal = rightTotal;
  const total = yesTotal + noTotal;
  const yesPercent = total === 0 ? 50 : (yesTotal / total) * 100;
  const noPercent = total === 0 ? 50 : (noTotal / total) * 100;

  const styles = {
    card: {
      border: "4px solid #DA291C",
      padding: "16px",
      margin: "16px 0 16px 20px",
      borderRadius: pillShape ? "40px" : "8px",
      backgroundColor: "white",
      color: "black",
      fontSize,
      width: "60%",
      fontFamily: "Futura, 'Trebuchet MS', Arial, sans-serif",
    },
    actions: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
    },
    comments: {
      marginTop: "10px",
      padding: "10px",
      background: "#ffffff",
    },
    barContainer: {
      width: "100%",
      height: "20px",
      display: "flex",
      backgroundColor: "#ddd",
      borderRadius: "6px",
      overflow: "hidden",
      marginTop: "10px",
    },
    barFill: {
      height: "100%",
      backgroundColor: betBarColor || "#4caf50",
      transition: "width 0.3s ease",
    },
  };

  return (
    <div style={styles.card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{ fontFamily: "Futura", fontSize: "14px", fontWeight: "bold" }}
          >
            Time left in bet: {timeLeft > 0 ? `${timeLeft}s` : "Over"}
          </div>
        </div>
      </div>

      <p>{content}</p>

      <div
        style={{ marginTop: "8px", display: "flex", justifyContent: "space-between" }}
      >
        <span>{leftLabel}: {yesPercent.toFixed(1)}%</span>
        <span>{rightLabel}: {noPercent.toFixed(1)}%</span>
      </div>

      <div style={styles.barContainer as React.CSSProperties}>
        <div
          onClick={() => {
            setSelectedSide("yes");
            setShowModal(true);
          }}
          style={{
            ...styles.barFill,
            width: `${yesPercent}%`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: betBarColor || "#4caf50",
            cursor: "pointer",
          }}
        >
          {yesPercent > 5 ? `${yesPercent.toFixed(1)}%` : ""}
        </div>

        <div
          onClick={() => {
            setSelectedSide("no");
            setShowModal(true);
          }}
          style={{
            height: "100%",
            width: `${noPercent}%`,
            backgroundColor: "#00DBD7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: noPercent < 5 ? "0px" : "6px",
            color: "#000",
            transition: "width 0.3s ease",
            cursor: "pointer",
          }}
        >
          {noPercent > 5 ? `${noPercent.toFixed(1)}%` : ""}
        </div>
      </div>

      <div style={styles.actions}>
        <Button
          backgroundColor="#ffffff"
          textColor={textColor}
          fontSize={fontSize}
          onClick={async () => {
            if (isSubmittingVote) return;

            setIsSubmittingVote(true);

            try {
              await onVote(marketId, "up");
            } finally {
              setIsSubmittingVote(false);
            }
          }}
        >
          <span style={{ color: "#DA291C" }}>↑</span>
        </Button>

        <span>{upvotes - downvotes}</span>

        <Button
          backgroundColor="#ffffff"
          textColor={textColor}
          fontSize={fontSize}
          onClick={async () => {
            if (isSubmittingVote) return;

            setIsSubmittingVote(true);

            try {
              await onVote(marketId, "down");
            } finally {
              setIsSubmittingVote(false);
            }
          }}
        >
          <span style={{ color: "#DA291C" }}>↓</span>
        </Button>

        <Button
          backgroundColor="#ffffff"
          textColor="#000"
          fontSize={14}
          onClick={() => setShowComments((currentValue) => !currentValue)}
        >
          {showComments ? "Hide Comments" : "Show Comments"}
        </Button>

        <div style={{ marginLeft: "auto" }}>
          <Button
            backgroundColor="#F7BB65"
            textColor="#000"
            fontSize={14}
            pillShape
          >
            Report
          </Button>
        </div>
      </div>

      {showComments && (
        <div style={styles.comments}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />

            <Button
              backgroundColor="#DA291C"
              textColor="#fff"
              fontSize={14}
              onClick={async () => {
                if (newComment.trim() === "" || isSubmittingComment) return;

                setCommentError("");
                setIsSubmittingComment(true);

                try {
                  const createdComment = await onAddComment(marketId, newComment);
                  setComments((currentComments) => [
                    ...currentComments,
                    createdComment,
                  ]);
                  setHasLoadedComments(true);
                  setNewComment("");
                } catch (error) {
                  setCommentError(
                    error instanceof Error ? error.message : "Failed to post comment"
                  );
                } finally {
                  setIsSubmittingComment(false);
                }
              }}
            >
              {isSubmittingComment ? "Posting..." : "Post"}
            </Button>
          </div>

          {commentError && <p>{commentError}</p>}

          {isLoadingComments ? (
            <p>Loading comments...</p>
          ) : comments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <p key={comment.id}>💬 {comment.body}</p>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
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
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: "#00001A",
              padding: "20px",
              borderRadius: "10px",
              width: "300px",
            }}
          >
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <div
                onClick={() => setSelectedSide("yes")}
                style={{
                  flex: 1,
                  padding: "10px",
                  textAlign: "center",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border:
                    selectedSide === "yes" ? "2px solid #4caf50" : "1px solid #ccc",
                  backgroundColor: selectedSide === "yes" ? "#e8f5e9" : "#fff",
                  fontWeight: selectedSide === "yes" ? "bold" : "normal",
                  color: selectedSide === "yes" ? "#000000" : "#000",
                }}
              >
                {leftLabel}
              </div>

              <div
                onClick={() => setSelectedSide("no")}
                style={{
                  flex: 1,
                  padding: "10px",
                  textAlign: "center",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border:
                    selectedSide === "no" ? "2px solid #00DBD7" : "1px solid #ccc",
                  backgroundColor: selectedSide === "no" ? "#e0f7fa" : "#fff",
                  fontWeight: selectedSide === "no" ? "bold" : "normal",
                  color: selectedSide === "yes" ? "#000000" : "#000",
                }}
              >
                {rightLabel}
              </div>
            </div>

            {betError && (
              <p style={{ color: "#ffb3b3", marginTop: "12px", marginBottom: 0 }}>
                {betError}
              </p>
            )}

            {selectedSide && (
              <input
                ref={inputRef}
                type="number"
                placeholder={`Enter amount for ${selectedLabel}`}
                value={wagerAmount}
                onChange={(event) => {
                  const value = event.target.value;
                  setWagerAmount(value === "" ? "" : Number(value));
                }}
                style={{
                  width: "100%",
                  marginTop: "15px",
                  padding: "5px",
                }}
              />
            )}

            <Button
              backgroundColor={backgroundColor}
              topMargin="15px"
              textColor={textColor}
              fontSize={fontSize}
              pillShape
              width="200px"
              onClick={async () => {
                if (
                  !selectedSide ||
                  wagerAmount === "" ||
                  wagerAmount <= 0 ||
                  isSubmittingBet
                ) {
                  return;
                }

                setBetError("");
                setIsSubmittingBet(true);

                try {
                  const outcomeId =
                    selectedSide === "yes" ? leftOutcomeId : rightOutcomeId;

                  await onPlaceBet(marketId, outcomeId, Number(wagerAmount));

                  setShowModal(false);
                  setSelectedSide(null);
                  setWagerAmount("");
                } catch (error) {
                  setBetError(
                    error instanceof Error ? error.message : "Failed to place bet"
                  );
                } finally {
                  setIsSubmittingBet(false);
                }
              }}
            >
              {isSubmittingBet
                ? "Placing Bet..."
                : `Place ${wagerAmount === "" ? 0 : wagerAmount}pt Bet`}
            </Button>
          </div>
        </div>
      )}

      {showPopup && (
        <div
          onClick={() => setShowPopup(false)}
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
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: "#00001A",
              padding: "20px",
              borderRadius: "10px",
              color: "white",
            }}
          >
            ⏰ Time is up - betting is now closed!
          </div>
        </div>
      )}
    </div>
  );
}
