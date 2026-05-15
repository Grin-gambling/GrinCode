import { useEffect, useRef, useState } from "react";
import type { MarketComment } from "./App";

import FullBetPost from "./FullBetPost";
import SmallBetPost from "./SmallBetPost";

import type { SharedPostProps } from "./types";

type BetPostContainerProps = SharedPostProps & {
  compact?: boolean;
};

export default function BetPostContainer({
  compact = false,

  marketId,
  backgroundColor,
  textColor,
  fontSize,
  pillShape,
  betBarColor,

  title,
  content,

  leftOutcomeId,
  leftLabel,
  leftTotal,

  rightOutcomeId,
  rightLabel,
  rightTotal,

  winningOutcomeId,

  status,
  closesAt,

  upvotes,
  downvotes,

  onPlaceBet,
  onResolveMarket,
  onVote,
  onLoadComments,
  onAddComment,

  startAllTimers,
}: BetPostContainerProps) {
  // ── Timer ──────────────────────────────────────────────────────────────────
  const [hasEnded, setHasEnded] = useState(
    () => new Date(closesAt).getTime() <= Date.now()
  );
  const [timeLeftMs, setTimeLeftMs] = useState(
    () => Math.max(new Date(closesAt).getTime() - Date.now(), 0)
  );

  useEffect(() => {
    if (!startAllTimers) return;

    const updateTimeLeft = () => {
      const next = Math.max(new Date(closesAt).getTime() - Date.now(), 0);
      setTimeLeftMs(next);
      if (next <= 0) {
        setHasEnded((current) => {
          if (!current) setShowClosedPopup(true);
          return true;
        });
      }
    };

    updateTimeLeft();
    if (new Date(closesAt).getTime() <= Date.now()) return;

    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [startAllTimers, closesAt]);

  // ── Bet modal ──────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [selectedSide, setSelectedSide] = useState<"yes" | "no" | null>(null);
  const [wagerAmount, setWagerAmount] = useState<number | "">("");
  const [betError, setBetError] = useState("");
  const [isSubmittingBet, setIsSubmittingBet] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal && selectedSide && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showModal, selectedSide]);

  // ── Votes ──────────────────────────────────────────────────────────────────
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteError, setVoteError] = useState("");

  // ── Comments ───────────────────────────────────────────────────────────────
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<MarketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (!showComments || hasLoadedComments) return;
    let isActive = true;

    const fetchComments = async () => {
      setCommentError("");
      setIsLoadingComments(true);
      try {
        const loaded = await onLoadComments(marketId);
        if (isActive) {
          setComments(loaded);
          setHasLoadedComments(true);
        }
      } catch (error) {
        if (isActive) {
          setCommentError(
            error instanceof Error ? error.message : "Failed to load comments"
          );
        }
      } finally {
        if (isActive) setIsLoadingComments(false);
      }
    };

    void fetchComments();
    return () => { isActive = false; };
  }, [showComments, hasLoadedComments, marketId, onLoadComments]);

  // ── Resolution ─────────────────────────────────────────────────────────────
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionError, setResolutionError] = useState("");

  // ── Report popup ───────────────────────────────────────────────────────────
  const [showReportPopup, setShowReportPopup] = useState(false);

  // ── "Market just closed" popup ─────────────────────────────────────────────
  const [showClosedPopup, setShowClosedPopup] = useState(false);

  // ── Shared calculations ────────────────────────────────────────────────────
  const total = leftTotal + rightTotal;
  const yesPercent = total === 0 ? 50 : (leftTotal / total) * 100;
  const noPercent = total === 0 ? 50 : (rightTotal / total) * 100;
  const marketIsClosed = status === "closed" || status === "resolved" || hasEnded;
  const upvoteScore = upvotes - downvotes;
  const winningLabel =
    winningOutcomeId === leftOutcomeId
      ? leftLabel
      : winningOutcomeId === rightOutcomeId
        ? rightLabel
        : null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleUpvote = async () => {
    if (isSubmittingVote) return;
    setVoteError("");
    setIsSubmittingVote(true);
    try {
      await onVote(marketId, "up");
    } catch (error) {
      setVoteError(error instanceof Error ? error.message : "Failed to submit vote");
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleDownvote = async () => {
    if (isSubmittingVote) return;
    setVoteError("");
    setIsSubmittingVote(true);
    try {
      await onVote(marketId, "down");
    } catch (error) {
      setVoteError(error instanceof Error ? error.message : "Failed to submit vote");
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handlePlaceBet = async () => {
    if (marketIsClosed || !selectedSide || wagerAmount === "" || wagerAmount <= 0 || isSubmittingBet) {
      return;
    }
    setBetError("");
    setIsSubmittingBet(true);
    try {
      const outcomeId = selectedSide === "yes" ? leftOutcomeId : rightOutcomeId;
      await onPlaceBet(marketId, outcomeId, Number(wagerAmount));
      setShowModal(false);
      setSelectedSide(null);
      setWagerAmount("");
    } catch (error) {
      setBetError(error instanceof Error ? error.message : "Failed to place bet");
    } finally {
      setIsSubmittingBet(false);
    }
  };

  const handleResolveLeft = async () => {
    if (isResolving) return;
    setResolutionError("");
    setIsResolving(true);
    try {
      await onResolveMarket(marketId, leftOutcomeId);
    } catch (error) {
      setResolutionError(error instanceof Error ? error.message : "Failed to resolve market");
    } finally {
      setIsResolving(false);
    }
  };

  const handleResolveRight = async () => {
    if (isResolving) return;
    setResolutionError("");
    setIsResolving(true);
    try {
      await onResolveMarket(marketId, rightOutcomeId);
    } catch (error) {
      setResolutionError(error instanceof Error ? error.message : "Failed to resolve market");
    } finally {
      setIsResolving(false);
    }
  };

  const handlePostComment = async () => {
    if (newComment.trim() === "" || isSubmittingComment) return;
    setCommentError("");
    setIsSubmittingComment(true);
    try {
      const created = await onAddComment(marketId, newComment);
      setComments((current) => [...current, created]);
      setHasLoadedComments(true);
      setNewComment("");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReport = () => {
    setShowReportPopup(true);
    setTimeout(() => setShowReportPopup(false), 2000);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <SmallBetPost
        title={title}
        leftLabel={leftLabel}
        rightLabel={rightLabel}
        yesPercent={yesPercent}
        noPercent={noPercent}
        marketIsClosed={marketIsClosed}
        upvoteScore={upvoteScore}
      />
    );
  }

  return (
    <FullBetPost
      backgroundColor={backgroundColor}
      textColor={textColor}
      fontSize={fontSize}
      pillShape={pillShape}
      betBarColor={betBarColor}
      title={title}
      content={content}
      leftLabel={leftLabel}
      rightLabel={rightLabel}
      yesPercent={yesPercent}
      noPercent={noPercent}
      marketIsClosed={marketIsClosed}
      status={status}
      winningLabel={winningLabel}
      timeLeftMs={timeLeftMs}
      upvoteScore={upvoteScore}
      showModal={showModal}
      setShowModal={setShowModal}
      selectedSide={selectedSide}
      setSelectedSide={setSelectedSide}
      wagerAmount={wagerAmount}
      setWagerAmount={setWagerAmount}
      betError={betError}
      isSubmittingBet={isSubmittingBet}
      onPlaceBet={handlePlaceBet}
      isSubmittingVote={isSubmittingVote}
      voteError={voteError}
      onUpvote={handleUpvote}
      onDownvote={handleDownvote}
      showComments={showComments}
      setShowComments={setShowComments}
      comments={comments}
      newComment={newComment}
      setNewComment={setNewComment}
      commentError={commentError}
      isLoadingComments={isLoadingComments}
      isSubmittingComment={isSubmittingComment}
      onPostComment={handlePostComment}
      isResolving={isResolving}
      resolutionError={resolutionError}
      onResolveLeft={handleResolveLeft}
      onResolveRight={handleResolveRight}
      showReportPopup={showReportPopup}
      onReport={handleReport}
      showClosedPopup={showClosedPopup}
      setShowClosedPopup={setShowClosedPopup}
    />
  );
}
