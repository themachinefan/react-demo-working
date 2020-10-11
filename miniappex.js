// import React from 'react';
// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
//App.js
import React, { Component } from 'react';
import Game from './Game';
import Board from './Board';
import PubNubReact from 'pubnub-react';
import Swal from "sweetalert2";  
import shortid  from 'shortid';
import './Game.css';

class App extends Component {
    constructor(props) { 
        super(props);
        this.pubnub = new PubNubReact({
            publishKey: "pub-c-3d2acc0c-8090-4539-947a-c77a05dc8cf4",
            subscribeKey: "sub-c-51720ec4-0b21-11eb-b978-f27038723aa3"
        });


        /////game specific
        this.state = {
            piece: '', // X or O
            isPlaying: false, //requires two players
            isRoomCreator: false,
            isDisabled: false,
            myTurn: false,

        };

        this.lobbyChannel = null;
        this.gameChannel = null;
        this.roomId = null; //unique id for room

        ///////////
        this.pubnub.init(this);//initialize pubnub
    }

    render() {
        return(
        <div>
           <div className="title">
               <p> React Tic Tac Toe</p>
            </div> 
        </div>);
  }
}

export default App
