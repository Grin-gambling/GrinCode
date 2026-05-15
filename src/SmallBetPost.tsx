type SmallBetPostProps = {
  title: string;
  leftLabel: string;
  rightLabel: string;

  yesPercent: number;
  noPercent: number;

  marketIsClosed: boolean;

  upvoteScore: number;
};

export default function SmallBetPost({
  title,
  leftLabel,
  rightLabel,
  yesPercent,
  noPercent,
  marketIsClosed,
  upvoteScore,
}: SmallBetPostProps) {
  return (
    <div
      style={{
        border: "3px solid #DA291C",
        padding: "12px",
        borderRadius: "20px",
        marginBottom: "12px",
        backgroundColor: "white",
        width: "40%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h3>{title}</h3>

        <span
          style={{
            color: marketIsClosed ? "#DA291C" : "#2f7d32",
            fontWeight: "bold",
          }}
        >
          {marketIsClosed ? "CLOSED" : "OPEN"}
        </span>
      </div>

      <p>↑ {upvoteScore}</p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          {leftLabel}: {yesPercent.toFixed(1)}%
        </span>

        <span>
          {rightLabel}: {noPercent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
