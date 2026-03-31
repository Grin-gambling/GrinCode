// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import banner from "./components/gambling-banner.jpg";
import Button from './button';
import Post from './betPost';


export default function App() {

  var backgroundColor = "#DA291C"
  var textcolor = "white"
  var fontSize = 18
  
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

      <p> Tuition doesn't gamble away itself Grinnellians do har har</p>

    <div>
      <Post
        backgroundColor={backgroundColor}
        textColor= {textcolor}
        fontSize={fontSize}
        pillShape
        title="Random Bet"
        content="This is a simple bet."
        leftLabel='team1'
        rightLabel='team2'
      />
    </div>
    

    </div>
  );
}





