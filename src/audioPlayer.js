'use strict';
import WaveSurfer from 'wavesurfer.js';

class AudioPlayer {
    constructor(audio, options = {height: 128, playButtonFirst: false}) {
        this.audio = audio;
        this.playButtonContent = `<i class="fas fa-play"></i> Play`;
        this.stopButtonContent = `<i class="fas fa-stop"></i> Stop`;

        // TODO defaults
        this.height = options.height;
        this.playButtonFirst = options.playButtonFirst;
    }

    createDomElements(target) {
        console.log('creating dom elements');
        target.append(`
            <div class="audio-player">
            </div>
            `);

        this.rootElement = target.find(`.audio-player`);

        if (this.audio) {
            console.log('adding waveform');
            this.rootElement.append(`<div class="waveform"></div>`);
            if (this.playButtonFirst) {
            this.rootElement.prepend(`<button class="play">${this.playButtonContent}</button>`);
            } else {

            this.rootElement.append(`<button class="play">${this.playButtonContent}</button>`);
            }
            console.log('waveform is', this.rootElement.find('.waveform'));
            this.waveform =this.rootElement.find(`.waveform`);

            this.waveSurfer = WaveSurfer.create({
                container: this.waveform[0],
                height: this.height,
                waveColor: '#88aaaa',
                progressColor: '#008899',
                cursorColor: '#88aaaa',
                minPxPerSec: 900

            });

            this.waveSurfer.loadBlob(new Blob([this.audio], { type: 'audio/wav' }));
            this.playBtn = this.rootElement.find('.play');

            this.waveSurfer.on('ready', () => {
                //this.rootElement.css('width',`${this.waveSurfer.getDuration()*50}px`);
                this.waveform.css('width',`${this.waveSurfer.getDuration()*50}px`);
                this.waveform.after(`<div class="duration">${Math.round(10*this.waveSurfer.getDuration())/10}s</div>`);
                this.waveSurfer.drawBuffer();
            });

            this.waveSurfer.on('play', () => {
                this.playBtn.html(this.stopButtonContent);
            });

            this.waveSurfer.on('finish', () => {
                this.playBtn.html(this.playButtonContent);
            });

            this.playBtn.click( () => {
                if (!this.waveSurfer.isPlaying()) {
                    this.waveSurfer.play();
                } else {
                    this.waveSurfer.stop();
                    this.playBtn.html(this.playButtonContent);
                }
            });
        }
    }

    toObject() {
        return {
            id: this.id,
            audio: this.audio
        };
    }
}

module.exports = AudioPlayer;
