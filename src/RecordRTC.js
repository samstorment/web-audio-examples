import React, { useEffect, useRef, useState } from 'react';
import RecordRTC from 'recordrtc';
import * as Tone from 'tone';

const createPlayer = async (audioFile) => {
    return new Promise((res, rej) => {
        const player = new Tone.Player(audioFile, () => {
            if (player) res(player.toDestination());
            else rej(new Error('error man!'));
        });
    });
}

export const RecordRTCRecorder = () => {

    const [ recording, setRecording ] = useState(false);
    const [ tracks, setTracks ] = useState([]);
    const rec = useRef(null);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                latency: 0
            } 
        })
        .then(async (stream) => {
            rec.current = RecordRTC(stream, { type: 'audio/wav' });
            console.log(rec.current);
        })
    }, []);


    const start = () => {

        rec.current.startRecording();
        setRecording(true);
        Tone.Transport.start();
    }

    const stop = () => {
        setRecording(false);
        Tone.Transport.stop();
        rec.current.stopRecording(() => {

            const blob = rec.current.getBlob();
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

    return (
        <div>
            <h1 style={{padding: "20px", textAlign: "center"}}>RecordRTC + ToneJS Player</h1>
            <button onClick={start} disabled={recording}>Start</button>
            <button onClick={stop} disabled={!recording}>Stop</button>
            <button onClick={() => Tone.Transport.toggle()}>Toggle Play</button>

            {tracks.map((t, i) => {
                return <div style={{padding: "20px", margin: "20px", border: "1px solid gray"}} key={i}>{t.title}</div>
            })}
        </div>
    )
}