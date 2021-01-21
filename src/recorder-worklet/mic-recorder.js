import { Mp3Encoder } from 'lamejs';

export default class MicRecorder {

    constructor(config) {

        this.context = new(window.AudioContext || window.webkitAudioContext)();

        console.log(this.context);

        this.mic = null;
        this.processor = null;
        this.analyser = null;
        this.stream = null;
        this.finished = false;

        this.file = null;
    }

    async build() {
     
        await this.context.audioWorklet.addModule('RecorderProcessor.js');
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // FOR CHROME specifically. Chrome requires a user interaction to create a new context. This works around that.
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
        
        this.mic = this.context.createMediaStreamSource(this.stream);
        this.processor = new AudioWorkletNode(this.context, 'processor', {
            processorOptions: {
                example: 'hello'
            }
        });
        // we don't NEED the analyser node to record, but it might be nice to look at the data
        this.analyser = new AnalyserNode(this.context);
        
        this.processor.port.onmessage = e => {

            const sampleData = e.data;

            console.log('SAMPLE DATA', sampleData);

            let sumOfLengths = sampleData[0].length * sampleData.length;

            let samples = new Int16Array(sumOfLengths);

            let currentIndex = 0;
            for (let arr of sampleData) {
                samples.set(arr, currentIndex);
                currentIndex += arr.length;
            }

            console.log('MERGED SAMPLES', samples);

            let mp3Data = [];
            const sampleBlockSize = 1152;
            const encoder = new Mp3Encoder(1, this.context.sampleRate, 128);

            for (let i = 0; i < samples.length; i += sampleBlockSize) {
                const sampleChunk = samples.subarray(i, i + sampleBlockSize);
                const mp3Buf = encoder.encodeBuffer(sampleChunk);

                if (mp3Buf.length > 0) {
                    mp3Data.push(mp3Buf);
                }
            }

            const mp3Buf = encoder.flush();

            if (mp3Buf.length > 0) {
                mp3Data.push(new Int8Array(mp3Buf));
            }

            const blob = new Blob(mp3Data, { type: 'audio/mp3' });
            
            this.file = new File(mp3Data, 'music.mp3', {
                type: blob.type,
                lastModified: Date.now()
            });
            
            console.log('WE MADE A FILE');

            const player = new Audio(URL.createObjectURL(this.file));
            player.controls = true;

            document.querySelector('#root').appendChild(player);

            this.file = null;
        }
    }

    start() {
        this.processor.port.postMessage({
            type: 'start',
            // encoder: new Encoder()
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