import React, { useEffect, useRef, useState } from 'react';
import context, { load } from './Audio';

export const WebAudioAPI = () => {

    const [ error, setError ] = useState(null);
    const [ recording, setRecording ] = useState(false);
    const [ tracks, setTracks ] = useState([]);
    const [ allowed, setAllowed ] = useState(false);
    const rec = useRef(null);
    const buf = useRef([]);


    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false
            } 
        })
        .then(stream => {

            setAllowed(true);

            rec.current = new MediaRecorder(stream);

            rec.current.onstop = async () => {     
                const title = prompt("Enter a track name", "My track");

                const blob = new Blob(buf.current, { type: 'audio/mp3' });
        
                buf.current = [];
        
                const url = URL.createObjectURL(blob);
                const source = await load(url);

                console.log(rec.current.stream);

                setTracks(tracks => {
                    return [...tracks, {
                        title,
                        source
                    }];
                });
            }
        
            rec.current.ondataavailable = e => {
                console.log(e.data);
                buf.current.push(e.data);
            }
        })
        .catch(err => setError(err.message));
    }, []);

    const start = async () => {
        setRecording(true);
        tracks.forEach(t => t.source.start());
        rec.current.start();
    }

    const stop = async () => {
        await rec.current.stop();
        tracks.forEach(t => t.source.stop());
        cleanTracks();
        setRecording(false);
    }

    const playAll = () => {
        tracks.forEach(t => t.source.start());
        cleanTracks();
    }

    const cleanTracks = () => {
        setTracks(tracks => {
            return tracks.map(t => {

                const source = context.createBufferSource();
                source.buffer = t.source.buffer;
                source.connect(context.destination);

                return { ...t, source };
            });
        });
    }
 
    if (!allowed) return <div>U gotta give the browser permission man!!!</div>

    return (
        <div>
            <h1 style={{padding: "20px", textAlign: "center"}}>Media Recorder API + Web Audio API Player</h1>
            <div>{error}</div>
            {/* <button onClick={click}>Click</button> */}
            <button onClick={start} disabled={recording}>Start</button>
            <button onClick={stop} disabled={!recording}>Stop</button>
            <button onClick={playAll} disabled={recording}>Play All</button>
            {tracks.map((t, i) => (
                <div key={i} style={{padding: "10px", margin: "10px", border: "1px solid black", display: "flex", justifyContent: "space-between"}}>
                    <span>{t.title}</span>
                    <span>{t.source.buffer.duration}</span>
                </div>
            ))}
        </div>
    )
}

