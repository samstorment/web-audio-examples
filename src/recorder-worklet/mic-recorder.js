import { Mp3Encoder } from 'lamejs';

export default class MicRecorder {

    constructor(config) {

        this.config = {
            audio: {
                echoCancellation: false
            }
        }

        this.context = new(window.AudioContext || window.webkitAudioContext)();

        console.log(this.context);

        this.mic = null;
        this.processor = null;
        this.analyser = null;
        this.stream = null;

        Object.assign(this.config, config);
    }

    async build(onStop) {
     
        await this.context.audioWorklet.addModule('RecorderProcessor.js');
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: this.config.audio });

        // FOR CHROME specifically. Chrome requires a user interaction to create a new context. This works around that.
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
        
        this.mic = this.context.createMediaStreamSource(this.stream);
        this.processor = new AudioWorkletNode(this.context, 'processor', {
            processorOptions: {
                example: 'hello',
            }
        });
        // we don't NEED the analyser node to record, but it might be nice to look at the data
        this.analyser = new AnalyserNode(this.context);
        
        this.processor.port.onmessage = e => {

            console.log('PRE PROCESSED', new Date(Date.now()).toISOString());
            
            const audioChannels = e.data;

            const numChannels = audioChannels.length;
            
            
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
                audioChannels[i] = mergedSamples;
            }
            
            console.log('CHANNELS', audioChannels);

            let mp3Data = [];
            const sampleBlockSize = 1152;
            const encoder = new Mp3Encoder(numChannels, this.context.sampleRate, 128);

            const sampleLength = Math.min(audioChannels[0].length, audioChannels[1].length);

            for (let i = 0; i < sampleLength; i += sampleBlockSize) {

                const audioChunks = audioChannels.map(sampleArray => sampleArray.subarray(i, i + sampleBlockSize));

                const mp3Buf = encoder.encodeBuffer(...audioChunks);

                if (mp3Buf.length > 0) {
                    mp3Data.push(mp3Buf);
                }
            }

            // get the last of the buffer that is smaller than our sample block size
            const mp3Buf = encoder.flush();

            console.log('LAST BUF', mp3Buf)

            if (mp3Buf.length > 0) {
                mp3Data.push(mp3Buf);
            }
        
            const blob = new Blob(mp3Data, { type: 'audio/mp3' });
            
            const file = new File(mp3Data, 'music.mp3', {
                type: blob.type,
                lastModified: Date.now()
            });
            
            console.log('WE MADE A FILE');

            const fileURL = URL.createObjectURL(file);
            const player = new Audio(fileURL);
            player.controls = true;

            onStop(fileURL);

            document.querySelector('#root').appendChild(player);

            console.log('POST PROCESSED', new Date(Date.now()).toISOString());
        }
    }

    start() {
        this.processor.port.postMessage({
            type: 'start'        
        });
    
        this.mic.connect(this.processor);
        this.processor.connect(this.analyser);
        this.analyser.connect(this.context.destination);
    }

    stop() {
        this.mic.disconnect(this.processor);
        this.processor.disconnect(this.analyser);
        this.analyser.disconnect(this.context.destination);
    
        // suspending the context while debgging because processor runs forever and gets slow while console logging otherwise
        // this.context.suspend();

        this.processor.port.postMessage({
            type: 'stop'
        });
    }
}