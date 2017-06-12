
export default class SoundSystem {

    constructor() {
        this.context = new window.AudioContext();

        this._sounds = new Map();
    }

    loadAudio(fileName, name) {
        return fetch(`audio/${fileName}`).then(res => {
            if (!res.ok) {
                throw new Error(`Audio file not accessible [audio/${fileName}]`);
            }

            return res.arrayBuffer()
                .then(buf => this.context.decodeAudioData(buf))
                .then(data => {
                    this._sounds.set(name, data);
                });
        });
    }

    _makeSource(buffer) {
        const context = this.context;

        const source = context.createBufferSource();
        const gain   = context.createGain();

        gain.gain.value = 0.3;
        source.buffer = buffer;
        source.connect(gain);

        // if (this.isCompressed) {
        //     const compressor = context.createDynamicsCompressor();
        //     compressor.threshold.value = 10;
        //     compressor.ratio.value = 20;
        //     compressor.reduction.value = -20;
        //     gain.connect(compressor);
        //     compressor.connect(context.destination);
        // } else {
        gain.connect(context.destination);

        return source;
    }

    play(name) {
        const buffer = this._sounds.get(name);

        if (!buffer) {
            throw new Error('Sound file not found.');
        }

        this._makeSource(buffer).start();
    }

}
