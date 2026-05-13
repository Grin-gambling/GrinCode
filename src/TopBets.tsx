type TopBetsPost = {
  id: string;
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftTotal: number;
  rightTotal: number;
};

type TopBetsProps = {
  posts: TopBetsPost[];
};

// Styles for the TopBets component
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
    marginTop: "15px",
    marginBottom: "20px",
    letterSpacing: "2px",
  },
};

export default function TopBets({ posts = [] }: TopBetsProps) {
  const topPosts = (Array.isArray(posts) ? posts : [])
    .filter(
      (p) =>
        typeof p.leftTotal === "number" &&
        typeof p.rightTotal === "number"
    )
    .slice()
    .sort(
      (a, b) =>
        (b.leftTotal + b.rightTotal) -
        (a.leftTotal + a.rightTotal)
    )
    .slice(0, 5);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        Top Bets
      </h2>

      {topPosts.length === 0 ? (
        <div style={{ fontSize: "14px", color: "#555", textAlign: "center" }}>
          No bets yet
        </div>
      ) : (
        topPosts.map((post) => {
          const total = post.leftTotal + post.rightTotal;

          return (
            <div
              key={post.id}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div style={{ fontWeight: "bold" }}>
                {post.title}
              </div>

              <div style={{ fontSize: "13px", color: "#555" }}>
                Pool: {total} acorns
              </div>

              <div style={{ fontSize: "12px", color: "#777" }}>
                {post.leftLabel}: {post.leftTotal} |{" "}
                {post.rightLabel}: {post.rightTotal}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}