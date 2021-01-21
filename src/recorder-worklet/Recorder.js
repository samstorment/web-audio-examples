import React, { useEffect, useRef, useState } from "react";
import MicRecorder from './mic-recorder';


export const Recorder = () => {

    const [ allowed, setAllowed ] = useState(false);
    const [ recording, setRecording ] = useState(false);
    const [ error, setError ] = useState(null);

    const rec = useRef(null);

    useEffect(() => {
        rec.current = new MicRecorder();

        rec.current.build()
        .then(() => {
            console.log('REC', rec.current);
            setAllowed(true);
            setError(null);
        })
        .catch(err => {
            setAllowed(false);
            setError(err.message);
        });
    }, []);


    const start = () => {
        setRecording(true);
        rec.current.start();
    }

    const stop = () => {
        setRecording(false);
        rec.current.stop();
    }


    if (error) return <div>Error: {error}</div>
    if (!allowed) return <div>We Aren't Allowed to record Mate!</div>

    return <div>
        <button onClick={start} disabled={recording}>Start</button>
        <button onClick={stop} disabled={!recording}>Stop</button>
    </div>
}