import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import SpotifyWebApi from 'spotify-web-api-js';
const spotifyApi = new SpotifyWebApi();


class TrackList extends Component {
  render () {
    var tracks = this.props.tracks.map((track, index) => {
      return (
        <TrackListItem key={index} track={track} index={index} selectTrack={this.props.selectTrack}/>
      );
    });
    return (
      <ul className="list-group"> {tracks} </ul>
    );
  }
}

class TrackListItem extends Component {
  constructor(props) {
    super(props);
    this.onSelectTrack = this.onSelectTrack.bind(this);
  }
  onSelectTrack() {
    var index = parseInt(this.props.index);
    this.props.selectTrack(index);
  }

  render () {
    return(
      <li key={this.props.track.trackname}>
      <button onClick={this.onSelectTrack}>Select</button>
      <span>{this.props.track.trackname}</span><span style={{marginLeft: 20 + 'px'}}>{this.props.track.artist}</span>
    </li>
    );
  }
}

class MusicPlayer extends Component {
  constructor(props){
    super(props);
    this.state = {
      audio: props.audio
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.audio !== this.props.audio;
  }

  componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.audio !== this.state.audio) {
      this.setState({ audio: nextProps.audio });
    }
  }

  componentDidUpdate() {
    this.refs.audio.load();
    this.refs.audio.play();
  }

  render() {
    return (
      <audio ref="audio" controls autoPlay={true}>
        <source src={this.state.audio} />
      </audio>
    );
  }
}

class QuizQuestion extends Component {
  constructor(params){
    super();
    this.selectTrack = this.selectTrack.bind(this);
  }
  selectTrack(trackId) {
    if(trackId == this.props.correctTrackIndex) {
      console.log("Correct track selected - ID " + trackId.toString())
    } else {
      console.log("Incorrect track selected - ID " + trackId.toString())      
    }
    this.props.onEndOfQuestion(trackId);
  }
  render() {
    return (
      <div>
      <MusicPlayer audio={ this.props.audio_url} />
      <TrackList tracks= {this.props.tracks} selectTrack={this.selectTrack}/>
      </div>
    );
  }
}

function QuizWrapper(props) {
  if(props.displayingAnswer) {
    return (<QuizAnswer selectedTrackIndex={props.selectedTrackIndex} correctTrackIndex={props.correctTrackIndex}/>);
  } else {
    return (<QuizQuestion correctTrackIndex={props.correctTrackIndex} audio_url={props.audio_url} tracks={props.tracks} onEndOfQuestion={props.onEndOfQuestion}/>);
  }
}

function QuizAnswer(props) {
  if(props.selectedTrackIndex == props.correctTrackIndex) {
    return (<div>Correct!</div>);
  } else {
    return (<div>Incorrect!</div>);
  }
  
}

class App extends Component {
  constructor(){
    super();
    const params = this.getHashParams();
    const token = params.access_token;
    if (token) {
      spotifyApi.setAccessToken(token);
    }
    this.state = {
      loggedIn: token ? true : false,
      audio_url: '',
      correctTrackIndex: 0,
      selectedTrackIndex: 0,
      tracks: [],
      displayingAnswer: true,
    }
    this.selectTrack = this.selectTrack.bind(this);
    this.onEndOfQuestion = this.onEndOfQuestion.bind(this);
  }
  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
    q = window.location.hash.substring(1);
    e = r.exec(q)
    while (e) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
      e = r.exec(q);
    }
    return hashParams;
  }
  onEndOfQuestion(selTrackIndex) {
    this.setState({
      displayingAnswer: true,
      selectedTrackIndex: selTrackIndex
    });
  }

  selectTrack(trackId) {
    if(trackId == this.state.correctTrackIndex) {
      console.log("Correct track selected - ID " + trackId.toString())
    } else {
      console.log("Incorrect track selected - ID " + trackId.toString())      
    }
    this.setState({selectedTrackIndex: trackId});
  }

  getNextQuestion() {
    spotifyApi.getMySavedTracks()
      .then((response) => {
        var randomIndexes = Array.from({length: 5}, () => Math.floor(Math.random() * 20));
        var correctTrackInd = Math.floor(Math.random() * randomIndexes.length);
        var tracksToUpdate = [];
        console.log("Correct track is " + response.items[randomIndexes[correctTrackInd]].track.name)
        for(var i in randomIndexes) {
          tracksToUpdate.push({
            trackname: response.items[randomIndexes[i]].track.name,
            artist: response.items[randomIndexes[i]].track.artists[0].name,
          });
        }
        this.setState({
          audio_url: response.items[randomIndexes[correctTrackInd]].track.preview_url,
          correctTrackIndex: correctTrackInd,
          tracks: tracksToUpdate,
          displayingAnswer: false
        });
      })
  }
  render() {
    return (
      <div className='App'>
      <a href='http://localhost:8888/login/'> Login to Spotify </a>
      <div>
        { this.state.loggedIn &&
          <button onClick={() => this.getNextQuestion()}>
            Get Next Question
          </button>
        }
      </div>
      <QuizWrapper selectedTrackIndex={this.state.selectedTrackIndex} displayingAnswer={this.state.displayingAnswer} correctTrackIndex={this.state.correctTrackIndex} audio_url={this.state.audio_url} tracks={this.state.tracks} onEndOfQuestion={this.onEndOfQuestion}/>
      </div>
    );
  }
}

export default App;
