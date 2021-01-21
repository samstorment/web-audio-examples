import { useEffect, useRef, useState } from "react";
import * as Tone from 'tone';

const createPlayer = async (audioFile) => {
    return new Promise((res, rej) => {
        const player = new Tone.Player(audioFile, () => {
            if (player) res(player.toDestination());
            else rej(new Error('error man!'));
        });
    });
}

export const MediaRecorderAPI = () => {

    const [ tracks, setTracks ] = useState([]);
    const [ allowed, setAllowed ] = useState(false);
    const [ recording, setRecording ] = useState(false);
    const [ playing, setPlaying ] = useState(false);
    const [ playWhileRecording, setPlayWhileRecording ] = useState(true);
    const rec = useRef(null);
    const buf = useRef([]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: true,
                latency: -.05
            } 
        })
        .then(stream => {
            setAllowed(true);
            rec.current = new MediaRecorder(stream)

            rec.current.onstop = e => {        
                const blob = new Blob(buf.current, { type: 'audio/mp3' });
        
                buf.current = [];
        
                const url = URL.createObjectURL(blob);

                createPlayer(url)
                .then(player => {

                    player.sync().start(0);

                    setTracks(tracks => [...tracks, {
                        title: `Track ${tracks.length + 1}`,
                        player
                    }]);
                });
            }
        
            rec.current.ondataavailable = e => {
                buf.current.push(e.data);
            }
        });
    }, []);

    const recordStartClick = () => {
        setRecording(true);
        rec.current.start()
        playWhileRecording && startTracks();
    }

    const recordStopClick = () => {
        rec.current.stop();
        setRecording(false);
        stopTracks();
    }

    const startTracks = () => {
        Tone.Transport.stop();
        setPlaying(true);
        Tone.Transport.start();
    }

    const stopTracks = () => {
        setPlaying(false);
        Tone.Transport.stop();
    }

    if (!allowed) return <div>Gotta allow mic access!</div>
    
    return (
        <div className="App">
            <h1 style={{padding: "20px", textAlign: "center"}}>Media Recorder API + ToneJS Player</h1>
            <div>{playing ? "Playing" : "Paused"}</div>
            <label>Play While Recording??</label>
            <input type="checkbox" onChange={(e) => setPlayWhileRecording(e.target.checked)} checked={playWhileRecording} /><br></br>
            <button onClick={recordStartClick} disabled={recording}>Start Recording</button>
            <button onClick={recordStopClick} disabled={!recording}>Stop Recording</button>
        
            <button onClick={startTracks} style={{backgroundColor: "limegreen", color: "white"}}>Start Tracks</button>
            <button onClick={stopTracks} style={{backgroundColor: "red", color: "white"}}>Stop Tracks</button>
           
            {tracks.map((t, i) => <Track key={i} track={t} playingState={[playing, setPlaying]}/>)}
        </div>
    );
}

const Track = ({track, playingState: [playing, setPlaying]}) => {

    const [ volume, setVolume ] = useState(0);

    
    const volumeChange = (e) => {
        track.player.volume.value = parseInt(e.target.value);
        setVolume(parseInt(e.target.value));
    }

    return (
        <div className="track">

            <div>{track.title}</div>
            {/* <button onClick={() => {Tone.Transport.toggle() }}>Play</button> */}
            <input type="range" min="-20" max="20" value={volume} onChange={volumeChange}/>
            <span>{volume} db</span>
            <button onClick={() => track.player.volume.value = -400}>mute</button>


            <div>
                <audio kind="main" label="wow"/>
            </div>
        </div>
    )
}