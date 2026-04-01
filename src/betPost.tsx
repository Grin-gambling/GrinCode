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
    leftLabel: string;
    rightLabel: string;
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
leftLabel,
rightLabel,
}: postProps) {
  const [votes, setVotes] = useState(0);
  const [showComments, setShowComments] = useState(false);


  //math for bar
  const percentage = Math.max(0, Math.min(100, votes));
  const noPercentage =  100 - percentage;

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
    // innerBox: {
    //   border: "1px solid #999",
    //   padding: "10px",
    //   marginTop: "10px",
    //   borderRadius: "6px",
    //   backgroundColor: betBarColor || "#000000",
    //   color: textColor || "#000",
    // },
    barContainer: {
      width: "100%",
      height: "20px",
      display: "flex",
      backgroundColor: "#ddd",
      borderRadius: "6px",
      overflow: "hidden",
      marginTop: "10px",
    },
    
    barFill: {
      height: "100%",
      backgroundColor: betBarColor || "#4caf50",
      transition: "width 0.3s ease",
    },
  };

  return (
    <div style={styles.card}>
      <h3>{title}</h3>
      <p>{content}</p>
    



        {/* this style here shows percentage on both sides */}
      <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between" }}>
        <span>{leftLabel}: {percentage}%</span>
        <span>{rightLabel}: {noPercentage}%</span>
      </div>


      <div style={styles.barContainer}>
        {/* LEFT (YES) */}
        <div
          style={{
            ...styles.barFill,
            width: `${percentage}%`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: betBarColor || "#4caf50",
          }}
        >
          {percentage > 5 ? `${percentage}%` : ""}
        </div>

        {/* RIGHT (NO) */}
        <div
          style={{
            height: "100%",
            width: `${noPercentage}%`,
            backgroundColor: "#00DBD7",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingLeft: noPercentage < 5 ? "0px" : "6px",           
            color: "#000",
            transition: "width 0.3s ease",
          }}
        >
          {noPercentage > 5 ? `${noPercentage}%` : ""}
        </div>
      </div>


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


      <Button
        backgroundColor= "#F7BB65"
        textColor= {textColor}
        fontSize={fontSize}
        pillShape
      >
        Report
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
