import { useRef } from "react";
import type { MarketComment } from "./App";
import Button from "./button";
import BetBar from "./BetBar";

type FullBetPostProps = {
  // Styling
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  pillShape?: boolean;
  betBarColor?: string;

  // Content
  title: string;
  content: string;
  leftLabel: string;
  rightLabel: string;

  // Computed percentages
  yesPercent: number;
  noPercent: number;

  // Market state
  marketIsClosed: boolean;
  status: "open" | "closed" | "resolved";
  winningLabel: string | null;
  timeLeftMs: number;
  upvoteScore: number;

  // Bet modal state
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  selectedSide: "yes" | "no" | null;
  setSelectedSide: (value: "yes" | "no" | null) => void;
  wagerAmount: number | "";
  setWagerAmount: (value: number | "") => void;
  betError: string;
  isSubmittingBet: boolean;
  onPlaceBet: () => void;

  // Vote state
  isSubmittingVote: boolean;
  voteError: string;
  onUpvote: () => void;
  onDownvote: () => void;

  // Comments state
  showComments: boolean;
  setShowComments: (value: boolean) => void;
  comments: MarketComment[];
  newComment: string;
  setNewComment: (value: string) => void;
  commentError: string;
  isLoadingComments: boolean;
  isSubmittingComment: boolean;
  onPostComment: () => void;

  // Resolution state
  isResolving: boolean;
  resolutionError: string;
  onResolveLeft: () => void;
  onResolveRight: () => void;

  // Report state
  showReportPopup: boolean;
  onReport: () => void;

  // "Market just closed" popup
  showClosedPopup: boolean;
  setShowClosedPopup: (value: boolean) => void;
};

function formatTimeRemaining(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (milliseconds <= 0) return "Closed";
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function FullBetPost({
  backgroundColor,
  textColor,
  fontSize,
  pillShape,
  betBarColor,
  title,
  content,
  leftLabel,
  rightLabel,
  yesPercent,
  noPercent,
  marketIsClosed,
  status,
  winningLabel,
  timeLeftMs,
  upvoteScore,
  showModal,
  setShowModal,
  selectedSide,
  setSelectedSide,
  wagerAmount,
  setWagerAmount,
  betError,
  isSubmittingBet,
  onPlaceBet,
  isSubmittingVote,
  voteError,
  onUpvote,
  onDownvote,
  showComments,
  setShowComments,
  comments,
  newComment,
  setNewComment,
  commentError,
  isLoadingComments,
  isSubmittingComment,
  onPostComment,
  isResolving,
  resolutionError,
  onResolveLeft,
  onResolveRight,
  showReportPopup,
  onReport,
  showClosedPopup,
  setShowClosedPopup,
}: FullBetPostProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel =
    selectedSide === "yes" ? leftLabel : selectedSide === "no" ? rightLabel : "";

  return (
    <div
      style={{
        border: "4px solid #DA291C",
        padding: "16px",
        margin: "16px 0 16px 20px",
        borderRadius: pillShape ? "40px" : "8px",
        backgroundColor: "white",
        color: "black",
        fontSize,
        width: "60%",
        fontFamily: "Futura, 'Trebuchet MS', Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>

        <div style={{ fontFamily: "Futura", fontSize: "14px", fontWeight: "bold" }}>
          Time remaining: {formatTimeRemaining(timeLeftMs)}
        </div>
      </div>

      <p>{content}</p>

      {/* Percentage labels */}
      <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between" }}>
        <span>{leftLabel}: {yesPercent.toFixed(1)}%</span>
        <span>{rightLabel}: {noPercent.toFixed(1)}%</span>
      </div>

      {/* Clickable bet bar */}
      <BetBar
        yesPercent={yesPercent}
        noPercent={noPercent}
        betBarColor={betBarColor}
        marketIsClosed={marketIsClosed}
        onYesClick={() => {
          setSelectedSide("yes");
          setShowModal(true);
        }}
        onNoClick={() => {
          setSelectedSide("no");
          setShowModal(true);
        }}
      />

      {/* Vote + comment + report actions */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "10px" }}>
        <Button
          backgroundColor="#ffffff"
          textColor={textColor}
          fontSize={fontSize}
          onClick={onUpvote}
        >
          <span style={{ color: "#DA291C" }}>↑</span>
        </Button>

        <span>{upvoteScore}</span>

        <Button
          backgroundColor="#ffffff"
          textColor={textColor}
          fontSize={fontSize}
          onClick={onDownvote}
        >
          <span style={{ color: "#DA291C" }}>↓</span>
        </Button>

        <Button
          backgroundColor="#ffffff"
          textColor="#000"
          fontSize={14}
          onClick={() => setShowComments(!showComments)}
        >
          {showComments ? "Hide Comments" : "Show Comments"}
        </Button>

        <div style={{ marginLeft: "auto" }}>
          <Button
            backgroundColor="#F7BB65"
            textColor="#000"
            fontSize={14}
            pillShape
            onClick={onReport}
          >
            Report
          </Button>
        </div>
      </div>

      {voteError && <p style={{ color: "#DA291C" }}>{voteError}</p>}
      {resolutionError && <p style={{ color: "#DA291C" }}>{resolutionError}</p>}

      {/* Resolve buttons (shown when closed but not yet resolved) */}
      {status === "closed" && (
        <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontWeight: "bold" }}>Resolve market:</span>
          <Button
            backgroundColor="#4caf50"
            textColor="#fff"
            fontSize={14}
            onClick={onResolveLeft}
          >
            {isResolving ? "Resolving..." : `Resolve ${leftLabel}`}
          </Button>
          <Button
            backgroundColor="#00DBD7"
            textColor="#000"
            fontSize={14}
            onClick={onResolveRight}
          >
            {isResolving ? "Resolving..." : `Resolve ${rightLabel}`}
          </Button>
        </div>
      )}

      {/* Winning outcome display */}
      {status === "resolved" && winningLabel && (
        <p style={{ marginTop: "12px", fontWeight: "bold", color: "#2f7d32" }}>
          Resolved winner: {winningLabel}
        </p>
      )}

      {/* Comments section */}
      {showComments && (
        <div style={{ marginTop: "10px", padding: "10px", background: "#ffffff" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
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
              onClick={onPostComment}
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
              <p key={comment.id}>Comment: {comment.body}</p>
            ))
          )}
        </div>
      )}

      {/* Bet modal */}
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
            onClick={(e) => e.stopPropagation()}
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
                  border: selectedSide === "yes" ? "2px solid #4caf50" : "1px solid #ccc",
                  backgroundColor: selectedSide === "yes" ? "#e8f5e9" : "#fff",
                  fontWeight: selectedSide === "yes" ? "bold" : "normal",
                  color: "#000",
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
                  border: selectedSide === "no" ? "2px solid #00DBD7" : "1px solid #ccc",
                  backgroundColor: selectedSide === "no" ? "#e0f7fa" : "#fff",
                  fontWeight: selectedSide === "no" ? "bold" : "normal",
                  color: "#000",
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
                placeholder={`Enter acorns for ${selectedLabel}`}
                value={wagerAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  setWagerAmount(value === "" ? "" : Number(value));
                }}
                style={{ width: "100%", marginTop: "15px", padding: "5px" }}
              />
            )}

            <Button
              backgroundColor={backgroundColor}
              topMargin="15px"
              textColor={textColor}
              fontSize={fontSize}
              pillShape
              width="200px"
              onClick={onPlaceBet}
            >
              {isSubmittingBet
                ? "Placing Bet..."
                : `Place ${wagerAmount === "" ? 0 : wagerAmount} acorn bet`}
            </Button>
          </div>
        </div>
      )}

      {/* "Market just closed" popup */}
      {showClosedPopup && (
        <div
          onClick={() => setShowClosedPopup(false)}
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
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#00001A",
              padding: "20px",
              borderRadius: "10px",
              color: "white",
            }}
          >
            Time is up. Betting is now closed.
          </div>
        </div>
      )}

      {/* Report confirmation popup */}
      {showReportPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "2px solid #DA291C",
              color: "black",
              padding: "20px 30px",
              borderRadius: "12px",
              maxWidth: "400px",
              fontSize: "18px",
            }}
          >
            Awww did someone's feelings get hurt? Don't worry, we have a team of highly
            trained monkeys ready to investigate any bad behavior on the platform. We take
            reports seriously and will ban anyone found breaking the rules. In the meantime,
            why not grab a snack and relax? Our monkeys are on the case! 🐒
          </div>
        </div>
      )}
    </div>
  );
}
