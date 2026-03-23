// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import banner from "./components/gambling-banner.jpg";
import Button from './button';

export default function App() {
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
        backgroundColor="#DA291C"
        textColor="white"
        fontSize={18}
        pillShape
      >
        Create Bet
      </Button>
    </div>

      <p> Tuition doesn't gamble away itself Grinnellians do har har</p>
    </div>
  );
}





