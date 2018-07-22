'use strict';
import $ from 'jquery';

class Response {
    constructor(id, payload, audio) {
        this.id = id;
        this.payload = payload;
        this.audio = audio;
    }

    createDomElements(target) {
        target.append(`
            <div class="response-block response-${this.id}">
            <button class="play">Play</button>
            </div>
            `);

        this.rootElement = target.find(`.response-${this.id}`);

        this.playBtn = this.rootElement.find('.play');
        this.playBtn.click( () => {

            if (this.audio !== null) {
                console.log('playing',this.audio);
                const copyOfAudio = new DataView(this.audio.slice(0));
                window.avs.player.enqueue(copyOfAudio) // play it back to the user
                    .then(() => window.avs.player.play());
            }


        });

    }


}

module.exports = Response;
