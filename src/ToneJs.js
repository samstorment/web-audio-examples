import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

const createPlayer = async (audioFile) => {
    return new Promise((res, rej) => {
        const player = new Tone.Player(audioFile, () => {
            if (player) res(player.toDestination());
            else rej(new Error('error man!'));
        });
    });
}


export const ToneJs = () => {

    const [ playWhileRecording, setPlayWhileRecording ] = useState(true);
    const [ playing, setPlaying ] = useState(false);
    // const [ longest, setLongest ] = useState(0);
    const [ tracks, setTracks ]   = useState([]);
    const [ allowed, setAllowed ] = useState(false);
    const [ recording, setRecording ] = useState(false);
    const rec = useRef(null);

    useEffect(() => {

        const um = new Tone.UserMedia();

        um.open()
        .then(() => {
            setAllowed(true);
            rec.current = new Tone.Recorder();
            um.connect(rec.current);
        }).catch(() => {
            setAllowed(false);
        });
    }, []);

    const recordStartClick = () => {
        setRecording(true);
        rec.current.start()
        .then(() => {
            playWhileRecording && startTracks();
        });
    }

    const recordStopClick = () => {
        setRecording(false);

        rec.current.stop()
        .then((blob) => {

            stopTracks();

            console.log(blob);

            const url = URL.createObjectURL(blob);

            createPlayer(url)
            .then(player => {

                player.sync().start(0);

                setTracks(tracks => [...tracks, {
                    title: `Track ${tracks.length + 1}`,
                    player
                }]);
            });
        });
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

    if (!allowed) { return <div style={{margin: "auto"}}>Gotta Give the browser mic permissions matey</div>}

    return (
        <div className="App">
            <h1 style={{padding: "20px", textAlign: "center"}}>ToneJS Recorder + ToneJS Player</h1>
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