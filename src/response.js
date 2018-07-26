'use strict';
import WaveSurfer from 'wavesurfer.js';
import AudioPlayer from './audioPlayer';

class Response {
    constructor(id, directive, audio) {
        this.id = id;
        this.directive = directive;
        this.playButtonContent = `<i class="fas fa-play"></i> Play`;
        this.stopButtonContent = `<i class="fas fa-stop"></i> Stop`;
        if (audio) {
            this.audioPlayer = new AudioPlayer(audio);
        }
    }

    createDomElements(target) {
        target.append(`
            <div class="response-block response-${this.id}">
            </div>
            `);

        this.rootElement = target.find(`.response-${this.id}`);

        if (this.audioPlayer) {
            this.audioPlayer.createDomElements(this.rootElement);

            /*
            console.log('adding waveform');
            this.rootElement.append(`<div><div class="waveform"></div></div><button class="play">${this.playButtonContent}</button>`);
            console.log('waveform is', this.rootElement.find('.waveform'));
            this.waveform =this.rootElement.find(`.waveform`);

            this.waveSurfer = WaveSurfer.create({
                container: this.waveform[0],
                waveColor: '#88aaaa',
                progressColor: '#008899',
                cursorColor: '#88aaaa',
                minPxPerSec: 900

            });

            this.waveSurfer.loadBlob(new Blob([this.audio], { type: 'audio/wav' }));
            this.playBtn = this.rootElement.find('.play');

            this.waveSurfer.on('ready', () => {
                this.rootElement.css('width',`${this.waveSurfer.getDuration()*50}px`);
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
            */
        }

        else if (this.directive.header.namespace === 'AudioPlayer') {

            let token = 'unknown';

            try {
                const tokenString = this.directive.payload.audioItem.stream.token;

                const jsonPart = tokenString.substring(tokenString.indexOf('{'));
                console.log('jsonPart is',jsonPart);
                token = JSON.parse(jsonPart).token;
            } catch(error) {
                console.error(error);
            }

            this.rootElement.append(`<p><b>AudioPlayer:${this.directive.header.name}</b></pre>
                <p><b>Token:</b> <code>${token}</code></p>
                <p><b>URL:</b> ${this.directive.payload.audioItem.stream.url}</p>
                `);
        }
    }

    toObject() {
        return {
            id: this.id,
            audio: this.audioPlayer ? this.audioPlayer.toObject() : null,
            directive: this.directive
        };
    }
}

module.exports = Response;
