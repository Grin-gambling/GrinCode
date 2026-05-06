type Player = {
  id: string;
  username: string;
  acorns: number;
};

interface LeaderboardProps {
  players: Player[];
}

export default function Leaderboard({ players }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.acorns - a.acorns);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Leaderboard</h2>
      {sorted.map((player, index) => (
        <div key={player.id} style={styles.row}>
          <span>{index + 1}. {player.username}</span>
          <span>{player.acorns} acorns</span>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "250px",
    padding: "0px",
    fontFamily: "Futura, sans-serif",
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "20px",
    marginTop: "0px",
    marginBottom: "20px",
    letterSpacing: "2px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
};
