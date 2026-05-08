// Currency.tsx

type CurrencyProps = {
  acorns: number;
};

export default function Currency({ acorns }: CurrencyProps) {
  return (
    // Box in top right corner that displays the amount of acorns the user has
    <div style={styles.container}>
      <span style={styles.label}>Acorns</span>
      <span style={styles.amount}>{acorns}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  // Formatting for box in top right corner that displays the amount of acorns the user has
  container: {
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 1100,
    border: "2px solid #da291c",
    backgroundColor: "#fff",
    padding: "10px 16px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    fontFamily: "Futura, 'Trebuchet MS', Arial, sans-serif",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
  },
  // Formatting the "balance" label (top right corner)
  label: {
    fontSize: "15px",
    opacity: 0.6,
    letterSpacing: "1px",
  },
  // Formatting the amount of acorns
  amount: {
    fontSize: "18px",
    fontWeight: "bold",
  },
};
