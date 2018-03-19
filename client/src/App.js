import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import SpotifyWebApi from 'spotify-web-api-js';
const spotifyApi = new SpotifyWebApi();

function MusicTrack(props) {
  return (
    <div className="trackWrapper">
      <span className="trackName">{props.track.trackname}</span>
      <span className="trackArtist" style={{marginLeft: 20 + 'px'}}>{props.track.artist}</span>
    </div>
  );
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
  }

  render() {
    return (
      <audio ref="audio" controls>
        <source src={this.state.audio} />
      </audio>
    );
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
      track1: {trackname: '', artist: ''},
      track2: {trackname: '', artist: ''},
      track3: {trackname: '', artist: ''},
      track4: {trackname: '', artist: ''},
      audio_url: '',
    }
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
  getNextQuestion() {
    spotifyApi.getMySavedTracks()
      .then((response) => {
        console.log(response);
        var randomIndexes = Array.from({length: 4}, () => Math.floor(Math.random() * 20));
        this.setState({
          track1: {
            trackname: response.items[randomIndexes[0]].track.name,
            artist: response.items[randomIndexes[0]].track.artists[0].name
          },
          track2: {
            trackname: response.items[randomIndexes[1]].track.name,
            artist: response.items[randomIndexes[1]].track.artists[0].name
          },
          track3: {
            trackname: response.items[randomIndexes[2]].track.name,
            artist: response.items[randomIndexes[2]].track.artists[0].name
          },
          track4: {
            trackname: response.items[randomIndexes[3]].track.name,
            artist: response.items[randomIndexes[3]].track.artists[0].name
          },
          audio_url: response.items[randomIndexes[0]].track.preview_url
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
      <MusicTrack track={ this.state.track1 } />
      <MusicTrack track={ this.state.track2 } />
      <MusicTrack track={ this.state.track3 } />
      <MusicTrack track={ this.state.track4 } />
      <MusicPlayer audio={ this.state.audio_url} />
      </div>
    );
  }
}

export default App;
