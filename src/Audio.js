const contextClass = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;
const context = contextClass ? new contextClass() : null;

export const load = async (url) => {

    const source = context.createBufferSource();

    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();

    console.log('ARRAY BUFFER', arrayBuffer);

    const decodedBuffer = await context.decodeAudioData(arrayBuffer);
    
    console.log('DECODED BUFFER', decodedBuffer.getChannelData(0));

    source.buffer = decodedBuffer;
    source.connect(context.destination);
    
    return source;
}

export default context;