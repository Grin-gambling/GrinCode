// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import banner from "./components/gambling-banner.jpg";
import Button from './button';
import Post from './betPost';
import { useState } from "react";

export default function App() {

  var backgroundColor = "#DA291C"
  var textcolor = "white"
  var fontSize = 18

  const [timerStarted, setTimerStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  // const [showPopup, setShowPopup] = useState(false);
  
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
        backgroundColor= {backgroundColor}
        textColor= {textcolor}
        fontSize={fontSize}
        pillShape
      >
        Create Bet
      </Button>
    </div>

      <div className="button-area">
        <Button
          backgroundColor="#444"
          textColor="#fff"
          fontSize={fontSize}
          pillShape
          width="200px"
          onClick={() => setTimerStarted(true)}
        >
          Pass Time
        </Button>
      </div>



      <p> Tuition doesn't gamble away itself Grinnellians do har har</p>

    <div>
      <Post
        backgroundColor={backgroundColor}
        textColor= {textcolor}
        fontSize={fontSize}
        pillShape
        title="Random Bet"
        content="chances that team1 beats team2"
        leftLabel='team1'
        rightLabel='team2'

        timerStarted={timerStarted}
        setTimerStarted={setTimerStarted}
        timeLeft={timeLeft}
        setTimeLeft={setTimeLeft}

      />
    </div>
    

    </div>
  );
}





