'use strict';

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
            this.rootElement.append(`<button class="play">Play</button>`);

            this.playBtn = this.rootElement.find('.play');
            this.playBtn.click( () => {

                console.log('playing',this.audio);
                const copyOfAudio = new DataView(this.audio.slice(0));
                window.avs.player.enqueue(copyOfAudio) // play it back to the user
                    .then(() => window.avs.player.play());
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
