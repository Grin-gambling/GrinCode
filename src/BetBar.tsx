type BetBarProps = {
  yesPercent: number;
  noPercent: number;
  betBarColor?: string;
  marketIsClosed: boolean;
  onYesClick: () => void;
  onNoClick: () => void;
};

export default function BetBar({
  yesPercent,
  noPercent,
  betBarColor,
  marketIsClosed,
  onYesClick,
  onNoClick,
}: BetBarProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "20px",
        display: "flex",
        backgroundColor: "#ddd",
        borderRadius: "6px",
        overflow: "hidden",
        marginTop: "10px",
      }}
    >
      <div
        onClick={() => {
          if (!marketIsClosed) {
            onYesClick();
          }
        }}
        style={{
          height: "100%",
          width: `${yesPercent}%`,
          backgroundColor: betBarColor ?? "#4caf50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "width 0.3s ease",
          cursor: marketIsClosed ? "not-allowed" : "pointer",
        }}
      >
        {yesPercent > 5 ? `${yesPercent.toFixed(1)}%` : ""}
      </div>

      <div
        onClick={() => {
          if (!marketIsClosed) {
            onNoClick();
          }
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
          cursor: marketIsClosed ? "not-allowed" : "pointer",
        }}
      >
        {noPercent > 5 ? `${noPercent.toFixed(1)}%` : ""}
      </div>
    </div>
  );
}
