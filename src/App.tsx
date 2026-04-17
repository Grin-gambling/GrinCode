import { useState } from "react";
import './App.css'
import banner from "./components/gambling-banner.jpg";
import Button from './button';
import Post from './betPost';
import Leaderboard from "./Leaderboard";
import Currency from "./currency";

const fakePlayers = [
  { id: "1", name: "Mina", balance: 1000 },
  { id: "2", name: "Lucas", balance: 0 },
  { id: "3", name: "Sam", balance: 0 },
  { id: "4", name: "Youssef", balance: 0 },
];

const currentUser = fakePlayers[0];

type BetPost = {
  title: string;
  content: string;
  leftLabel: string;
  rightLabel: string;
};

export default function App() {
  const backgroundColor = "#DA291C";
  const textcolor = "white";
  const fontSize = 18;

  const [posts, setPosts] = useState<BetPost[]>([
    {
      title: "Random Bet",
      content: "chances that team1 beats team2",
      leftLabel: "team1",
      rightLabel: "team2",
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLeft, setNewLeft] = useState("");
  const [newRight, setNewRight] = useState("");

  const [startAllTimers, setStartAllTimers] = useState(false);

  const handleCreatePost = () => {
    if (!newTitle || !newContent || !newLeft || !newRight) return;
    const newPost: BetPost = {
      title: newTitle,
      content: newContent,
      leftLabel: newLeft,
      rightLabel: newRight,
    };

    setPosts((prev) => [newPost, ...prev]);

    setNewTitle("");
    setNewContent("");
    setNewLeft("");
    setNewRight("");
    setShowCreateModal(false);
  };

  return (
    <div>
      <div className="banner">
        <img
          src={banner}
          alt="Website Banner"
        />
        <h1>G R I N G A M B L I N G</h1>
        <Currency balance={currentUser.balance} />
      </div>

      <div className="button-area">
        <Button
          backgroundColor="#DA291C"
          textColor={textcolor}
          fontSize={fontSize}
          pillShape
          onClick={() => setShowCreateModal(true)}
        >
          Create Bet
        </Button>
      </div>
      <div className="button-area">
        <Button
          backgroundColor="#000000"
          textColor={textcolor}
          fontSize={fontSize}
          pillShape
          // width="150px"
          onClick={() => setStartAllTimers(true)}
        >
          Pass Time
        </Button>
      </div>
      <div style={{ display: "flex" }}>
  
  {/* LEFT SIDE: Bets feed */}
  <div style={{ flex: 1 }}>
    {posts.map((post, index) => (
      <Post
        key={index}
        backgroundColor={backgroundColor}
        textColor={textcolor}
        fontSize={fontSize}
        pillShape
        title={post.title}
        content={post.content}
        leftLabel={post.leftLabel}
        rightLabel={post.rightLabel}
        startAllTimers={startAllTimers}
      />
    ))}
  </div>

{/* Display the Leaderboard on the right side. */}
<div
  style={{
    width: "250px",
    border: "5px solid #DA291C",
    padding: "15px",
    borderRadius: "8px",
    marginLeft: "10px",
    marginTop: "20px",
    marginRight: "20px",
  }}
>
  <Leaderboard players={fakePlayers} />
</div>

</div>
  {showCreateModal && (
    <div
      onClick={() => setShowCreateModal(false)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.65)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          // This is styles for the Create Bet pop-up
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          width: "600px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          border: "3px solid #DA291C",
        }}
      >
      <h2 style={{ margin: 0 }}>Create Bet</h2>

      <input
        type="text"
        placeholder="Bet title"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        style={{ padding: "8px" }}
      />

            <input
              type="text"
              placeholder="Bet description"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              style={{ padding: "8px" }}
            />

            <input
              type="text"
              placeholder="Left option"
              value={newLeft}
              onChange={(e) => setNewLeft(e.target.value)}
              style={{ padding: "8px" }}
            />

            <input
              type="text"
              placeholder="Right option"
              value={newRight}
              onChange={(e) => setNewRight(e.target.value)}
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
    </div>
  );
}


