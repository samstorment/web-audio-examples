import { Mp3Encoder } from 'lamejs';

export default class MicRecorder {

    constructor(config) {

        this.context = new(window.AudioContext || window.webkitAudioContext)({
            latencyHint: 'interactive'
        });

        this.config = {
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                latency: 0
            },
            trimStart: 0,
            trimEnd: 0
        }

        this.mic = null;
        this.processor = null;
        this.analyser = null;
        this.stream = null;

        Object.assign(this.config, config);
    }

    async build() {
        await this.context.audioWorklet.addModule('RecorderProcessor.js');
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: this.config.audio });
    }

    async start() {
        await this.context.resume();
        
        this.mic = this.context.createMediaStreamSource(this.stream);
        // can pass a third argument, an object with a processorOptions object to give the constructor custom initialization data https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode/AudioWorkletNode
        this.processor = new AudioWorkletNode(this.context, 'processor');

        
        this.mic.connect(this.processor);
        // this.processor.connect(this.context.destination);

        this.processor.port.postMessage('start');

        console.log('2) TOLD PROCESSOR TO START', new Date(Date.now()).toISOString());
    }

    async stop() {

        this.mic.disconnect(this.processor);

        this.processor.port.postMessage('stop');

        // await this.context.suspend();

        return new Promise((resolve, reject) => {
            this.processor.port.onmessage = e => {
                try { resolve(this.createMp3(e.data)); } 
                catch (err) { reject(err); }
            }
        });
        
    }

    // creates mp3 from the array of audio channel data
    createMp3(audioChannels) {

        const numChannels = audioChannels.length;

        if (numChannels > 2) { throw new Error('Too Many Audio Channels'); }
        
        for (let i in audioChannels) {
            
            const sampleData = audioChannels[i];
            
            // the sum of lengths of all frames of audio
            let sumOfLengths = sampleData[0].length * sampleData.length;
            let mergedSamples = new Int16Array(sumOfLengths);
            
            let currentIndex = 0;
            for (let arr of sampleData) {
                mergedSamples.set(arr, currentIndex);
                currentIndex += arr.length;
            }

            const startSlice = parseInt(this.config.trimStart * this.context.sampleRate);
            const endSlice = mergedSamples.length - parseInt(this.config.trimEnd * this.context.sampleRate);

            audioChannels[i] = mergedSamples.slice(startSlice, endSlice);
        }
        
        let mp3Data = [];
        const sampleBlockSize = 1152;
        const encoder = new Mp3Encoder(numChannels, this.context.sampleRate, 128);

        let sampleLength = 0;
        
        if (numChannels === 2) { 
            sampleLength = Math.min(audioChannels[0].length, audioChannels[1].length);
        } else if (numChannels === 1) {
            sampleLength = audioChannels[0].length;
        }
        
        for (let i = 0; i < sampleLength; i += sampleBlockSize) {

            const audioChunks = audioChannels.map(sampleArray => sampleArray.subarray(i, i + sampleBlockSize));

            const mp3Buf = encoder.encodeBuffer(...audioChunks);

            if (mp3Buf.length > 0) {
                mp3Data.push(mp3Buf);
            }
        }

        // get the last of the buffer that is smaller than our sample block size
        const mp3Buf = encoder.flush();

        if (mp3Buf.length > 0) {
            mp3Data.push(mp3Buf);
        }
    
        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        
        const file = new File(mp3Data, 'music.mp3', {
            type: blob.type,
            lastModified: Date.now()
        });
        
        return URL.createObjectURL(file);
    }
}