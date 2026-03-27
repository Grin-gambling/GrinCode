import { useState } from "react";
import Button from "./button"

type postProps = {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    pillShape?: boolean;
    title: string;
    content: string;
    betBarColor?: string;
    // children?: React.ReactNode;
};

export default function Post({ 
backgroundColor,
textColor,
fontSize,
pillShape,
title,
content,
betBarColor,
}: postProps) {
  const [votes, setVotes] = useState(0);
  const [showComments, setShowComments] = useState(false);

  const styles = {
    card: {
      border: "1px solid #ccc",
      padding: "16px",
      margin: "16px 0 16px 20px", //the 20 moves it to the right a little
      borderRadius: pillShape ? "40px" : "8px",
      backgroundColor: backgroundColor,
      color: textColor,
      fontSize: fontSize,
      width: "50%",
    },
    actions: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
    },
    comments: {
      marginTop: "10px",
      padding: "10px",
      background: backgroundColor,
    },
    innerBox: {
      border: "1px solid #999",
      padding: "10px",
      marginTop: "10px",
      borderRadius: "6px",
      backgroundColor: betBarColor || "#000000",
      color: textColor || "#000",
    },
  };

  return (
    <div style={styles.card}>
      <h3>{title}</h3>
      <p>{content}</p>


      <div style={styles.actions}>

    
        <Button //Upvote
          backgroundColor = {backgroundColor}  
          textColor= {textColor}
          fontSize={fontSize}
          onClick={() => setVotes(votes + 1)}
        >
          ⬆️
        </Button>

        <span>{votes}</span> {/*display amount of votes*/}
        <Button //Downvote
          backgroundColor = {backgroundColor} 
          textColor= {textColor}
          fontSize={fontSize}
          onClick={() => setVotes(votes - 1)}
        >
          ⬇️
        </Button>


        <Button
          backgroundColor="#FFFFF0"
          textColor="#000"
          fontSize={14}
          onClick={() => setShowComments(!showComments)}
        >
          {showComments ? "Hide Comments" : "Show Comments"}
        </Button>
      </div>

      {showComments && (
        <div style={styles.comments}>
          <p>💬 Comment 1</p>
          <p>💬 Comment 2</p>
        </div>
      )}
    </div>
  );
}
