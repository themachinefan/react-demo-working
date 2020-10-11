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
import PubNub from 'pubnub';
//broken import {usePubNub} from 'pubnub-react';
//import PubNubReact from 'pubnub-react'
//import {PubNubReact} from 'pubnub-react';
import Swal from "sweetalert2";  
import shortid  from 'shortid';
import './Game.css';


// pubnub.addListener({
//     status: function(statusEvent) {
//         if (statusEvent.category === "PNConnectedCategory") {
//             publishSampleMessage();
//         }
//     },
//     message: function(msg) {
//         console.log(msg.message.title);
//         console.log(msg.message.description);
//     },
//     presence: function(presenceEvent) {
//         // This is where you handle presence. Not important for now :)
//     }
// })

const LOBBY_STRING = "tictactoelobby--";
const GAME_STRING = "tictactoegame--";
class App extends Component {
    constructor(props) { 
        super(props);
        this.pubnub = new PubNub({
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

        this.pubnub.addListener(
            {
            message: (msg) => {
                console.log(msg)
                console.log("fixed?",msg.message.notRoomCreator);
                if (msg.message.notRoomCreator){
                    this.gameChannel = GAME_STRING + this.roomId;
    
                    this.pubnub.subscribe({
                        channels: [this.gameChannel]
                    });
                    console.log("got thing");
                    this.setState({
                        isPlaying: true
                    });
            
                    //in case still open
                    Swal.close();
                }
            }
                
            }
        )

        ///////////
       // this.pubnub.init(this);//initialize pubnub
    }
    //at end
    componentWillUnmount() {
        this.pubnub.unsubscribe({
          channels : [this.lobbyChannel, this.gameChannel]
        });
      }

    //runs every update (builtin..)
    // componentDidUpdate(){
    // //check that someone is connected to a channel, if so listen
    // if (this.lobbyChannel != null){
    //     this.pubnub.getMessageActions(this.lobbyChannel, (msg) => {
    //         console.log(msg)
    //         console.log("hiiii",msg.message.notRoomCreator);
    //         if (msg.message.notRoomCreator){
    //             this.gameChannel = GAME_STRING + this.roomId;

    //             this.pubnub.subscribe({
    //                 channels: [this.gameChannel]
    //             });
    //             console.log("got thing");
    //             this.setState({
    //                 isPlaying: true
    //             });
        
    //             //in case still open
    //             Swal.close();
    //         }
    //     });

     
    // }
    // }

    //joining a channel
    onPressJoin = (e) => {
       Swal.fire({
           position: 'top',
           input: 'text',
           allowOutsideClick: false,
           inputPlaceholder: 'Enter the room id',
           showCancelButton: true,
           confirmButtonColor: 'rgb(208,33,41)',
           confirmButtonText: 'OK',
           width: 275,
           padding: '0.7em',
           customClass: {
               heightAuto: 'popup-class',
               confirmButton: 'join-button-class',
               cancelButton: 'join-button-class'
           }
       }).then((result)=> {
           // check if user typed a value
           if(result.value){
                this.joinRoom(result.value);
           }
       }) 

    }

    joinRoom = (value) => {
        this.roomId = value;
        this.lobbyChannel = LOBBY_STRING + this.roomId;
        //check number of people in channel
        this.pubnub.hereNow({
            channels: [this.lobbyChannel],
        }).then((response) => {
            console.log("currently broke",response.totalOccupancy);
            if (response.totalOccupancy < 2){
            console.log('if',this.lobbyChannel);
            //subscribe listens
            this.pubnub.subscribe({
                channels: [this.lobbyChannel],
                withPresence: true
            });
            
            this.setState({
                piece: 'O', // Player 0
            });
            // send data that can be received with 'getMessage'
            this.pubnub.publish({
                message: {
                    notRoomCreator: true,
                },
                channel: this.lobbyChannel
            });
        }
        else {
            console.log("else");
            Swal.fire({
                position: 'top',
                allowOutsideClick: false,
                title: 'Error',
                text: 'Game in progress, Try another room.',
                width: 275,
                padding: '0.7em',
                customClass: {
                    heightAuto: false,
                    title: 'title-class',
                    popup: 'popup-class',
                    confirmButton: 'button-class'
                }
            })
        }
        }).catch((error) => {
            console.log(error);
        });

        
    }

    //creating a room 
    onPressCreate = (e) => {
        this.roomId = shortid.generate().substring(0,5);
        this.lobbyChannel = LOBBY_STRING + this.roomId;
        console.log(this.lobbyChannel);
        this.pubnub.subscribe({
            channels: [this.lobbyChannel],
            withPresence: true //checks # people in channel
        });

        //sweetalert2 replaces javascripts default alert()
        Swal.fire({
            position: 'top',
            allowOutsideClick: false,
            title: 'Share this room ID with your friends',
            text: this.roomId,
            width: 275,
            padding: '0.7em',
            // Custom CSS to change the size of the model
            customClass: {
                heightAuto: false,
                title: 'title-class',
                popup: 'popup-class',
                confirmButton: 'button-class'
            }
        });

        this.setState({
            piece: 'X',
            isRoomCreator: true,
            isDisabled: true, //disable 'create button'
            myTurn: true, //player X makes first move
        });
    }

        // Reset everything
        endGame = () => {
            this.setState({
              piece: '',
              isPlaying: false,
              isRoomCreator: false,
              isDisabled: false,
              myTurn: false,
            });
            this.lobbyChannel = null;
            this.gameChannel = null;
            this.roomId = null;  
            this.pubnub.unsubscribe({
              channels : [this.lobbyChannel, this.gameChannel]
            });
          }

    //vars used with {} in this case the && allows for bools
    //can add arguments (props) to your html sections to get ex Board or Game
    render() {
        let status;
        status = `${this.state.isPlaying ? "Playing": "NotPlaying"}`;
        return(
        <div>
           <div className="title">
        <p> React Tic Tac Toe... {status} Current ID: {this.roomId}</p>
            </div>
            { 
                !this.state.isPlaying &&
                <div className="game">
                    <div className="board">
                        <Board 
                            squares={0}
                            onClick={index => null}
                        />
                    <div className="button-container">
                        <button
                            className="create-button "
                            disabled={this.state.isDisabled}
                            onClick={(e) => this.onPressCreate()}
                            > Create
                        </button>
                        <button
                            className="join-button"
                            onClick={(e) => this.onPressJoin()}
                            >join
                        </button>

                    </div>
                    </div>
                </div>
            }

            {
                this.state.isPlaying &&
                <Game 
                    pubnub={this.pubnub}
                    gameChannel={this.gameChannel}
                    piece={this.state.piece}
                    isRoomCreator={this.state.isRoomCreator}
                    myTurn={this.state.myTurn}
                    xUsername={this.state.xUsername}
                    oUsername={this.state.oUsername}
                    endGame={this.endGame}
                />
            }

        </div>);
  }
}

export default App
