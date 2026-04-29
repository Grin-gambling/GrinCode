type CurrencyProps = {
  balance: number;
};

export default function Currency({ balance }: CurrencyProps) {
  return (
    <div style={styles.container}>
      <span style={styles.label}>Balance</span>
      <span style={styles.amount}>${balance}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  label: {
    fontSize: "15px",
    opacity: 0.6,
    letterSpacing: "1px",
  },
  amount: {
    fontSize: "18px",
    fontWeight: "bold",
  },
};