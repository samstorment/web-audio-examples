import React, { useState } from 'react';

const ctx = new AudioContext();

export const BypassWorklet = () => {

    const [ on, setOn ] = useState(false);
    const [ isFirstClick, setIsFirstClick ] = useState(true);

    const playSineWave = async () => {
        await ctx.audioWorklet.addModule('bypass-processor.js');
        const oscillator = new OscillatorNode(ctx);
        const bypasser = new AudioWorkletNode(ctx, 'bypass-processor');
        oscillator.connect(bypasser).connect(ctx.destination);
        oscillator.start();
    }

    const start = () => {
        if (isFirstClick) {
            playSineWave();
            setIsFirstClick(false); 
        }
        setOn(true);
        ctx.resume();
    }

    const stop = () => {
        ctx.suspend();
        setOn(false);
    }

    const click = () => {
        on ? stop() : start();
    }

    return <>
        <h1 style={{padding: "20px", textAlign: "center"}}>Bypass Worklet Example</h1>
        <button onClick={click}>{on ? 'Stop' : 'Start'}</button>
    </>
}