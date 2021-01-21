class Processor extends AudioWorkletProcessor {

    constructor(options) {
        super();
        console.log('Processor Constructed');

        this.buffer = [];

        // The processor will only receive messages on stop. When that happens,
        // Send all the audio data off to the main thread to get processed
        this.port.onmessage = e => {

            if (e.data.type === 'start') {
                console.log('STARTED', e.data);
            }
            
            if (e.data.type === 'stop') {
                this.port.postMessage(this.buffer);
                this.buffer = [];
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


    process(inputs, outputs, params) {

        // get the first and only input that we'll expect
        const firstInput = inputs[0];
        // get the channel data from the first input, we expect this to be a Float32Array
        const inputData = firstInput[0];

        if (inputData) {
            const i16samples = this.floatTo16BitPCM(inputData);

            this.buffer.push(i16samples);
        }

        return true;
    }

    // // the process function we use to play audio, works nicely
    // process(inputs, outputs, params) {

    //     // for a stereo input, input is an array of 2 float 32 arrays, 1 for each channel
    //     // those float32 arrays are all 128 floats long 
    //     const input = inputs[0];
    //     const output = outputs[0];

    //     for (let channel = 0; channel < input.length; ++channel) {
    //         output[channel].set(input[channel]);
    //     }
    
    //     return true;
    // }
}

registerProcessor('processor', Processor);