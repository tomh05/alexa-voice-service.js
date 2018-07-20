'use strict';
import $ from 'jquery';

class Response {
    constructor(id) {

        this.id = id;
    }


    createDomElements(target) {
        target.append(`
            <div class="response-block response-${this.id}">
            <button class="play">Play</button>
            </div>
            `);

        this.rootElement = $(`.response-${this.id}`);

        this.playBtn = this.rootElement.find('.play');
        this.playBtn.click( () => {

        });

    }


}

module.exports = Response;
