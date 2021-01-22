import React, { useEffect, useRef, useState } from "react";
import MicRecorder from './mic-recorder';
import * as Tone from 'tone';

console.log(Tone.Context.rawContext);

const createPlayer = async (audioFile) => {
    return new Promise((res, rej) => {
        const player = new Tone.Player(audioFile, () => {
            if (player) res(player.toDestination());
            else rej(new Error('error man!'));
        });
    });
}

export const Recorder = () => {

    const [ allowed, setAllowed ] = useState(false);
    const [ recording, setRecording ] = useState(false);
    const [ playing, setPlaying ] = useState(false);
    const [ error, setError ] = useState(null);

    const [ tracks, setTracks ] = useState([]);

    const rec = useRef(null);

    useEffect(() => {
        rec.current = new MicRecorder();

        rec.current.build(url => {
            createPlayer(url)
            .then(player => {

                player.sync().start(0);

                setTracks(tracks => [...tracks, {
                    title: `Track ${tracks.length + 1}`,
                    player
                }]);
            });
        })
        .then(() => {
            setAllowed(true);
            setError(null);
        })
        .catch(err => {
            setAllowed(false);
            setError(err.message);
        });
    }, []);


    const recordStartClick = () => {
        setRecording(true);
        rec.current.start();
        startTracks();
    }

    const recordStopClick = () => {
        setRecording(false);
        stopTracks();
        rec.current.stop();
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


    if (error) return <div>Error: {error}</div>
    if (!allowed) return <div>We Aren't Allowed to record Mate!</div>

    return <div>
        <button onClick={recordStartClick} disabled={recording}>Start Recording</button>
        <button onClick={recordStopClick} disabled={!recording}>Stop Recording</button>
    
        <button onClick={startTracks} style={{backgroundColor: "limegreen", color: "white"}}>Start Tracks</button>
        <button onClick={stopTracks} style={{backgroundColor: "red", color: "white"}}>Stop Tracks</button>

        {tracks.map((t, i) => <Track key={i} track={t} playingState={[playing, setPlaying]}/>)}
    </div>
}

const Track = ({track}) => {

    const [ volume, setVolume ] = useState(0);

    const mute = () => {
        if (track.player.mute) { 
            track.player.mute = false;
            setVolume(track.player.volume.value);
            return;
        }
        track.player.mute = true;
        setVolume(-400);
    }

    
    const volumeChange = (e) => {
        if (e.target.value <= -20) { return mute(); }
        track.player.volume.value = parseInt(e.target.value);
        setVolume(parseInt(e.target.value));
    }

    return (
        <div className="track">
            <div>{track.title}</div>
            {/* <button onClick={() => {Tone.Transport.toggle() }}>Play</button> */}
            <input type="range" min="-20" max="20" value={volume} onChange={volumeChange}/>
            <span>{volume} db</span>
            <button onClick={mute}>{volume <= -400 ? "Unmute" : "Mute"}</button>


            <div>
                <audio kind="main" label="wow"/>
            </div>
        </div>
    )
}