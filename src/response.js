'use strict';
import WaveSurfer from 'wavesurfer.js';

class Response {
    constructor(id, directive, audio) {
        this.id = id;
        this.directive = directive;
        this.audio = audio;
    }

    createDomElements(target) {
        target.append(`
            <div class="response-block response-${this.id}">
            </div>
            `);

        this.rootElement = target.find(`.response-${this.id}`);

        if (this.audio) {
            console.log('adding waveform');
            this.rootElement.append(`<div><div class="waveform"></div></div><button class="play">Play</button>`);
            console.log('waveform is', this.rootElement.find('.waveform'));
            this.waveform =this.rootElement.find(`.waveform`);

            this.waveSurfer = WaveSurfer.create({
                container: this.waveform[0],
                waveColor: '#88aaaa',
                progressColor: '#008899',
                cursorColor: '#88aaaa',
                minPxPerSec: 900

            });

            console.log('audio is', typeof this.audio);
            this.waveSurfer.loadBlob(new Blob([this.audio], { type: 'audio/wav' }));
            console.log('duration is', this.waveSurfer.getDuration());

            this.waveSurfer.on('ready', () => {
                console.log('post is', this.waveSurfer.getDuration());
                this.rootElement.css('width',`${this.waveSurfer.getDuration()*50}px`);
                //this.waveSurfer.drawer.containerWidth = this.waveSurfer.getDuration()*10;
                this.waveSurfer.drawBuffer();
            });

            this.playBtn = this.rootElement.find('.play');
            this.playBtn.click( () => {
                this.waveSurfer.play();

                /*
                console.log('playing',this.audio);
                const copyOfAudio = new DataView(this.audio.slice(0));
                window.avs.player.enqueue(copyOfAudio) // play it back to the user
                    .then(() => window.avs.player.play());
                    */
            });



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
            audio: this.audio,
            directive: this.directive
        };
    }
}

module.exports = Response;
