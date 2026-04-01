import { useState } from "react";
import './App.css'
import banner from "./components/gambling-banner.jpg";
import Button from './button';
import Post from './betPost';

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
      </div>

      <div className="button-area">
        <Button
          backgroundColor={backgroundColor}
          textColor={textcolor}
          fontSize={fontSize}
          pillShape
          onClick={() => setShowCreateModal(true)}
        >
          Create Bet
        </Button>
      </div>

      <p>Tuition doesn't gamble away itself Grinnellians do har har</p>

      <div>
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
          />
        ))}
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
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "600px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
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


