class Processor extends AudioWorkletProcessor {

    constructor(options) {
        super();

        this.buffer = [];
        this.recording = false;

        // We'll only recieve a message when the recording should stop
        // Send all the audio data off to the main thread to get processed, then clear the buffer
        this.port.onmessage = e => {
        
            if (e.data === 'stop') {   
                this.recording = false;
                this.port.postMessage(this.buffer);
                this.buffer = [];
            }

            if (e.data === 'start') {
                this.recording = true;
            }
          
        }
    }

    floatTo16BitPCM(f32arr) {

        const length = f32arr.length;

        let i16arr = new Int16Array(length);

        for (let i = 0; i < length; i++) {
          const s = Math.max(-1, Math.min(1, f32arr[i]));
          i16arr[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
        }

        return i16arr;
    }


    // process(inputs, outputs, params) {

    //     // get the first and only input that we'll expect
    //     const firstInput = inputs[0];
    //     // get the sample data from the firstInput's first channel, we expect this to be a Float32Array
    //     const sampleData = firstInput[0];

    //     if (sampleData) {
    //         const i16samples = this.floatTo16BitPCM(sampleData);

    //         this.buffer.push(i16samples);
    //     }
        

    //     return true;
    // }

    process(inputs, outputs, params) {

        if (!this.recording) { return; }

        for (let input of inputs) {
            for (let i in input) {
                const sampleData = input[i];

                const i16SampleData = this.floatTo16BitPCM(sampleData);

                if (this.buffer[i]) {
                    this.buffer[i].push(i16SampleData);
                } else {
                    this.buffer[i] = [];
                    this.buffer[i].push(i16SampleData);
                }
            }
        }

        return true;
    }
}

registerProcessor('processor', Processor);