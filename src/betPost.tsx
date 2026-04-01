import { useState } from "react";
import { useRef, useEffect } from "react";
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
    startAllTimers: boolean;

    
    // children?: React.ReactNode;
};

type Bet = {
  side: "yes" | "no";
  amount: number;
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
startAllTimers,

}: postProps) {
  const [votes, setVotes] = useState(0);

  const [bets, setBets] = useState<Bet[]>([]);


  // const [timeLeft, setTimeLeft] = useState(10);
  
  const [showComments, setShowComments] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const [timeLeft, setTimeLeft] = useState(5);
  const [timerStarted, setTimerStarted] = useState(false);


  const [showModal, setShowModal] = useState(false);
  const [selectedSide, setSelectedSide] = useState<"yes" | "no" | null>(null);
  const [wagerAmount, setWagerAmount] = useState<number | "">("");

  // const [timerStarted, setTimerStarted] = useState(false);


  //highlights text when pop-up to place bet is opened
  useEffect(() => {
    if (showModal && selectedSide && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // highlights number
    }
  }, [showModal, selectedSide]);

  useEffect(() => {
    if (startAllTimers) {
      setTimerStarted(true);
    }
  }, [startAllTimers]);


  useEffect(() => {
    if (!timerStarted) return;
    if (timeLeft <= 0) {
      if (!hasEnded) {
        setShowPopup(true);
        setHasEnded(true);
      }
      return;
    }
  
    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
  
    return () => clearInterval(interval);
  }, [timerStarted, timeLeft, hasEnded]);


  const selectedLabel =
  selectedSide === "yes"
    ? leftLabel
    : selectedSide === "no"
    ? rightLabel
    : "";

  const yesTotal = bets
    .filter((bet) => bet.side === "yes")
    .reduce((sum, bet) => sum + bet.amount, 0);

  const noTotal = bets
    .filter((bet) => bet.side === "no")
    .reduce((sum, bet) => sum + bet.amount, 0);

  const total = yesTotal + noTotal;
  const yesPercent = total === 0 ? 50 : (yesTotal / total) * 100;
  const noPercent = total === 0 ? 50 : (noTotal / total) * 100;


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
      // position: "relative",
    },
    
    barFill: {
      height: "100%",
      backgroundColor: betBarColor || "#4caf50",
      transition: "width 0.3s ease",
    },
  };

  return (
    <div style={styles.card}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "Futura", fontSize: "14px", fontWeight: "bold" }}>
            Time left in bet:  {timeLeft > 0 ? `${timeLeft}s` : "Over"}
          </div>

        </div>


      </div>

      <p>{content}</p>

    

        {/* this style here shows percentage on both sides */}
      <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between" }}>
        <span>{leftLabel}: {yesPercent.toFixed(1)}%</span>
        <span>{rightLabel}: {noPercent.toFixed(1)}%</span>
      </div>


      <div style={styles.barContainer as React.CSSProperties}>
        {/* LEFT (YES) */}
        <div
          onClick={() => {
            setSelectedSide("yes");
            setShowModal(true);

          }}
          style={{
            ...styles.barFill,
            width: `${yesPercent}%`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: betBarColor || "#4caf50",
            cursor: "pointer",
          }}
          
        >
          {yesPercent > 5 ? `${yesPercent.toFixed(1)}%` : ""}
        </div>

        {/* RIGHT (NO) */}
        <div
          onClick={() => {
            setSelectedSide("no");
            setShowModal(true);

          }}
          style={{
            height: "100%",
            width: `${noPercent}%`,
            backgroundColor: "#00DBD7",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingLeft: noPercent < 5 ? "0px" : "6px",           
            color: "#000",
            transition: "width 0.3s ease",
            cursor: "pointer",
          }}
        >
          {noPercent > 5 ? `${noPercent.toFixed(1)}%` : ""}
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


{showModal && (

  <div
  
    onClick={() => setShowModal(false)}
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
    }}
  >
    
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#00001A",
        padding: "20px",
        borderRadius: "10px",
        width: "300px",
      }}
    >


<div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
  
  {/* LEFT OPTION */}
  <div
    onClick={() => setSelectedSide("yes")}
    style={{
      flex: 1,
      padding: "10px",
      textAlign: "center",
      borderRadius: "6px",
      cursor: "pointer",
      border: selectedSide === "yes" ? "2px solid #4caf50" : "1px solid #ccc",
      backgroundColor: selectedSide === "yes" ? "#e8f5e9" : "#fff",
      fontWeight: selectedSide === "yes" ? "bold" : "normal",
      color: selectedSide === "yes" ? "#000000" : "#000",
    }}
  >
    {leftLabel}
  </div>

  {/* RIGHT OPTION */}
  <div
    onClick={() => setSelectedSide("no")}
    style={{
      flex: 1,
      padding: "10px",
      textAlign: "center",
      borderRadius: "6px",
      cursor: "pointer",
      border: selectedSide === "no" ? "2px solid #00DBD7" : "1px solid #ccc",
      backgroundColor: selectedSide === "no" ? "#e0f7fa" : "#fff",
      fontWeight: selectedSide === "no" ? "bold" : "normal",
      color: selectedSide === "yes" ? "#000000" : "#000",
    }}
  >
    {rightLabel}
  </div>

</div>

{selectedSide && (
  <input
  ref={inputRef}
  type="number"
  placeholder={`Enter amount for ${selectedLabel}`}
  value={wagerAmount}
  onChange={(e) => {
    const value = e.target.value;
    setWagerAmount(value === "" ? "" : Number(value));
  }}
  style={{
    width: "100%",
    marginTop: "15px",
    padding: "5px",
  }}
/>
)}

            <Button
              backgroundColor={backgroundColor}
              topMargin="15px"
              textColor={textColor}
              fontSize={fontSize}
              pillShape
              width="200px"
              onClick={() => {
                if (!selectedSide || wagerAmount === "" || wagerAmount <= 0) return;
              
                const newBet: Bet = {
                  side: selectedSide,
                  amount: Number(wagerAmount),
                };
              
                setBets((prev) => [...prev, newBet]);
              
                setShowModal(false);
                setSelectedSide(null);
                setWagerAmount("");
              }


              }
            >
              Place {wagerAmount === "" ? 0 : wagerAmount}pt Bet
            </Button>

          </div>

          

    </div>

)}



{showPopup && (//Shows popup when timer elapses
  <div
    onClick={() => setShowPopup(false)}
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
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#00001A",
        padding: "20px",
        borderRadius: "10px",
        color: "white",
      }}
    >
      ⏰ Time is up — betting is now closed!
    </div>
  </div>
)}




    </div>
  );
}