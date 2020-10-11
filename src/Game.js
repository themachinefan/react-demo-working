import React from "react";
import Board from "./Board.js"
import PubNub from 'pubnub';
import Swal from "sweetalert2";  

class Game extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            squares: Array(9).fill(''), // 3x3 board
            xScore: 0,
            oScore: 0,
            whosTurn: this.props.myTurn // Player X goes first
        };

        this.turn = 'X';
        this.gameOver = false;
        this.counter = 0; //Game ends in a tie when counter is 9

    }

    //runs after first render
    componentDidUpdate(){
        this.props.pubnub.addListener({
            message: (msg) => {
                //checks to make sure only the current player listens to this
                if (msg.message.turn === this.props.piece){
                    this.publishMove(msg.message.index, msg.message.piece);
                }
            }
        })
    }

    publishMove = (index, piece) => {
        const squares = this.state.squares;

        squares[index] = piece;
        this.turn = (squares[index] === 'X')? 'O' : 'X';

        this.setState({
            squares: squares,
            whosTurn: !this.state.whosTurn
        });

        this.checkForWinner(squares)
    }
    //props args to games got from app
    onMakeMove = (index) => {
        console.log("MOVE MADE");
        const squares = this.state.squares;

        //check if empty and your turn
        if (!squares[index] && (this.turn === this.props.piece)){
            squares[index] = this.props.piece;

            this.setState({
                squares: squares,
                whosTurn: !this.state.whosTurn
            });

            this.turn = (this.turn === 'X') ? 'O' : 'X';

            this.props.pubnub.publish({
                message: {
                    index: index,
                    piece: this.props.piece,
                    turn: this.turn
                },
                channel: this.props.gameChannel
            });

            // CHeck if there is a winner

            this.checkForWinner(squares)
        }
    }

    checkForWinner = (squares) => {
        // Possible winning combinations
        const possibleCombinations = [
          [0, 1, 2],
          [3, 4, 5],
          [6, 7, 8],
          [0, 3, 6],
          [1, 4, 7],
          [2, 5, 8],
          [0, 4, 8],
          [2, 4, 6],
        ];
        // Iterate every combination to see if there is a match
        for (let i = 0; i < possibleCombinations.length; i += 1) {
          const [a, b, c] = possibleCombinations[i];
          if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            this.announceWinner(squares[a]);
            return;
          }
        }
            // Below the for loop in checkForWinner()
    // Check if the game ends in a draw
    this.counter++;
    // The board is filled up and there is no winner
    if(this.counter === 9){
      this.gameOver = true;
      this.newRound(null);
    }
      }


    

    // Update score for the winner
    announceWinner = (winner) => {
        let pieces = {
          'X': this.state.xScore,
          'O': this.state.oScore
        }
        if(winner === 'X'){
          pieces['X'] += 1;
          this.setState({
            xScore: pieces['X']
          });
        }
        else{
          pieces['O'] += 1;
          this.setState({
            oScore: pieces['O']
          });
        }
        // End the game once there is a winner
        this.gameOver = true;
        this.newRound(winner);  
      }

      newRound = (winner) => {
        // Announce the winner or announce a tie game
        let title = (winner === null) ? 'Tie game!' : `Player ${winner} won!`;
        // Show this to Player O
        if((this.props.isRoomCreator === false) && this.gameOver){
          Swal.fire({  
            position: 'top',
            allowOutsideClick: false,
            title: title,
            text: 'Waiting for a new round...',
            confirmButtonColor: 'rgb(208,33,41)',
            width: 275,
            customClass: {
                heightAuto: false,
                title: 'title-class',
                popup: 'popup-class',
                confirmButton: 'button-class',
            } ,
          });
          this.turn = 'X'; // Set turn to X so Player O can't make a move 
        } 
        // Show this to Player X
        else if(this.props.isRoomCreator && this.gameOver){
          Swal.fire({      
            position: 'top',
            allowOutsideClick: false,
            title: title,
            text: 'Continue Playing?',
            showCancelButton: true,
            confirmButtonColor: 'rgb(208,33,41)',
            cancelButtonColor: '#aaa',
            cancelButtonText: 'Nope',
            confirmButtonText: 'Yea!',
            width: 275,
            customClass: {
                heightAuto: false,
                title: 'title-class',
                popup: 'popup-class',
                confirmButton: 'button-class',
                cancelButton: 'button-class'
            } ,
          }).then((result) => {
            // Start a new round
            if (result.value) {
              this.props.pubnub.publish({
                message: {
                  reset: true
                },
                channel: this.props.gameChannel
              });
            }
            else{
              // End the game
              this.props.pubnub.publish({
                message: {
                  endGame: true
                },
                channel: this.props.gameChannel
              });
            }
          })      
        }
       }
  
  

    render () {
        let status;
        status = `${this.state.whosTurn ? "Your turn": "Opponent's turn"}`;
        return (
            <div className="game">
                <div className="board">
                <Board 
                    squares={this.state.squares}
                    onClick={index =>this.onMakeMove(index)}
                />
                <p className="status-info">{status}</p>
                </div>

                <div className="scores-container">
                <div>
                    <p>Player X: {this.state.xScore}</p>
                </div>
                
                <div>
                    <p>Player O: {this.state.oScore}</p>
                </div>
                </div>
            </div>

        );
    }
}

export default Game;