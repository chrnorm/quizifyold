import React, { Component } from 'react';
import './App.css';

import SpotifyWebApi from 'spotify-web-api-js';
import ReactAudioPlayer from 'react-audio-player';
import ReactCardFlip from 'react-card-flip';
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
    var index = this.props.index;
    this.props.selectTrack(index);
  }
  
  render () {
    return(
      <li className='tracklistitem' onClick={this.onSelectTrack} key={this.props.track.trackname}>
      <span className='itemtrackname'>{this.props.track.trackname}</span><span className='itemtrackartist' style={{marginLeft: 20 + 'px'}}>{this.props.track.artist}</span>
      </li>
    );
  }
}

class MusicPlayerContainer extends Component {
  constructor(props){
    super(props);
    this.state = {
      audio_url: props.audio,
      percentLeft: 100
    }
    this.onListen = this.onListen.bind(this);
  }
  
  onListen(audioCurrentTime) {
    var nextPercentLeft = (( 10 - audioCurrentTime ) / 10 ) * 100;
    if(nextPercentLeft <= 0) {
      this.audioplayer.audioEl.pause();
      this.props.onMusicTimeout();
    } else {
      this.setState({percentLeft: nextPercentLeft});
    }
  }
  
  
  componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.audio !== this.state.audio_url) {
      this.setState({ audio_url: nextProps.audio });
    }
  }
  
  render() {
    return (
      <div>
      <ReactAudioPlayer ref={(element) => { this.audioplayer = element; }} src={this.state.audio_url} autoPlay listenInterval={10} onListen={this.onListen}/>
      <CountdownBar width={this.state.percentLeft} />
      </div>
    );
  }
}

class CountdownBar extends Component {
  render() {
    return (
      <div className='countdownbar' style={{ width: this.props.width + '%'}} />
    )
  }
}

class QuizQuestion extends Component {
  constructor(props){
    super();
    this.selectTrack = this.selectTrack.bind(this);
    this.handleMusicTimeout = this.handleMusicTimeout.bind(this);
  }
  selectTrack(trackId) {
    if(trackId === this.props.correctTrackIndex) {
      console.log("Correct track selected - ID " + trackId.toString())
    } else {
      console.log("Incorrect track selected - ID " + trackId.toString())      
    }
    this.props.onEndOfQuestion(trackId);
  }
  
  handleMusicTimeout() {
    console.log("track timed out - incorrect answer!");
    this.props.onEndOfQuestion(-1); // hacky way to do this - need to think about how to do better
  }
  
  render() {
    return (
      <div>
      <MusicPlayerContainer audio={ this.props.audio_url} onMusicTimeout={this.handleMusicTimeout}/>
      <TrackList tracks= {this.props.tracks} selectTrack={this.selectTrack}/>
      </div>
    );
  }
}

class AlbumArtwork extends Component {
  render() {
    return (
      <img src={this.props.albumart} />
    )
  }
}

function QuizAnswer(props) {
  return (
    <div>
    { props.correctAnswer ? 'Correct!' : 'Incorrect!'}
    </div>
  );
}

function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
}

class MusicLibraryContainer extends Component {
  constructor(props){
    super();
    const token = props.access_token;
    if (token) {
      spotifyApi.setAccessToken(token);
    }
    this.state = {
      allTracks: []
    }
    spotifyApi.getMySavedTracks()
    .then((response) => {
      console.log("got saved tracks in musiclibrary");
      this.setState({ allTracks: response.items });
    });
  }
  
  componentDidMount() {
    var mySavedTracks = [];
    var options = {'limit':50,'offset':30}
    spotifyApi.getMySavedTracks(options)
    .then((response) => {
      console.log("got saved tracks in musiclibrary");
      response.items.forEach(item => {
        if(item.track.preview_url) mySavedTracks.push(item);
      });
      //TODO refactor to a function to avoid repeating code on spotify api calls
      var options = { 'limit': 50, 'offset': 80 }
      spotifyApi.getMySavedTracks(options)
      .then((response) => {
        console.log("got saved tracks in musiclibrary");
        response.items.forEach(item => {
          if (item.track.preview_url) mySavedTracks.push(item);
        });
        this.setState({ allTracks: mySavedTracks });
        this.getNewTracks();
      });
    });
  }
  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.shouldUpdateTracks !== this.props.shouldUpdateTracks;
  }
  
  componentDidUpdate() {
    if(this.props.shouldUpdateTracks) {
      this.getNewTracks();
    }
  }
  
  getNewTracks() {
    // get a new set of random tracks and pass them back to the parent
    console.log("getnewtracks");
    var allTracks = this.state.allTracks;
    shuffle(allTracks);
    var randomIndexes = [0, 1, 2, 3, 4];
    var correctTrackInd = Math.floor(Math.random() * randomIndexes.length);
    var audio_url = allTracks[randomIndexes[correctTrackInd]].track.preview_url;
    var albumart = allTracks[randomIndexes[correctTrackInd]].track.album.images[0].url;
    var tracksToUpdate = [];
    console.log("Correct track is " + allTracks[randomIndexes[correctTrackInd]].track.name)
    for (var i in randomIndexes) {
      tracksToUpdate.push({
        trackname: allTracks[randomIndexes[i]].track.name,
        artist: allTracks[randomIndexes[i]].track.artists[0].name,
      });
    }
    this.props.onTracksUpdated(tracksToUpdate, correctTrackInd, audio_url, albumart);
  }
  
  render() {
    return null;
  }
}

class QuizContainer extends Component {
  constructor(params) {
    super();
    const token = params.access_token;
    this.state = {
      loggedIn: token ? true : false,
      audio_url: '',
      correctTrackIndex: 0,
      tracks: [],
      displayingAnswer: true,
      lastAnswerCorrect: false,
      albumart: ''
    }
    this.onEndOfQuestion = this.onEndOfQuestion.bind(this);
    this.onTracksUpdated = this.onTracksUpdated.bind(this);
  }
  
  onEndOfQuestion(selTrackIndex) {
    var correct;
    if(selTrackIndex === this.state.correctTrackIndex) {
      correct = true;
    } else {
      correct = false;
    }
    this.setState({
      displayingAnswer: true,
      lastAnswerCorrect: correct,
      selectedTrackIndex: selTrackIndex
    });
  }
  
  onTracksUpdated(newTracks, newCorrectTrackIndex, newAudioUrl, newAlbumart) {
    this.setState({
      tracks: newTracks,
      correctTrackIndex: newCorrectTrackIndex,
      audio_url: newAudioUrl,
      albumart: newAlbumart
    });
  }
  
  getNextQuestion() {
    this.setState({displayingAnswer: false});
  }
  
  render() {
    return (
      <div>
      <MusicLibraryContainer access_token={this.token} shouldUpdateTracks={this.state.displayingAnswer} onTracksUpdated={this.onTracksUpdated}/>
      {/* <ReactCardFlip isFlipped={!this.state.displayingAnswer}> */}
        <div className='MainBox' key='back' style={{
          backgroundImage: `url(${this.state.albumart})`}}>
      { this.state.displayingAnswer || <QuizQuestion correctTrackIndex={this.state.correctTrackIndex} audio_url={this.state.audio_url} tracks={this.state.tracks} onEndOfQuestion={this.onEndOfQuestion} />}
      </div>
        <div className='quizanswer'>
          {this.state.displayingAnswer && <QuizAnswer correctAnswer={this.state.lastAnswerCorrect} />}
          {this.state.displayingAnswer && <button onClick={() => this.getNextQuestion()}>Get Next Question</button>}
        </div>
      {/* </ReactCardFlip> */}
      </div>
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
      audio_url: '',
      correctTrackIndex: 0,
      selectedTrackIndex: 0,
      tracks: [],
      displayingAnswer: true,
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
  
  render() {
    return (
      <div className='App'>
      <div className='BoxWrapper'>
      { this.state.loggedIn ? (
        <QuizContainer access_token={this.token} />
      ) : (
        <a href='http://localhost:8888/login/'> Login to Spotify </a>
      )
    }
    </div>
    </div>
  );
}
}

export default App;
