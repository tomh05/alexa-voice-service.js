'use strict';
const TestInteraction = require('./testinteraction');
import $ from 'jquery';

class Test {
    constructor(id) {

        this.id = id;
        this.testInteractions = [];
    }

    addInteraction() {

        const newId = this.testInteractions.length;
        const newInteraction = new TestInteraction(newId);

        newInteraction.createDomElements(this.interactionsBlock);
        this.testInteractions.push(newInteraction);
    }

    createDomElements(target) {
        target.append(`
            <div class="test-block" id="test-${this.id}">
            <div>
            <h1 contentEditable="true">Test_${this.id}</h1>
            <span class="hint">(click to rename)</span>
            </div>
            <button class="runTestBtn">Run Test</button>
            <div class="test-interactions"> </div>
            <button class="addInteractionBtn">+ Add Interaction</button>
            </div>
            `);

        this.rootElement = $(`#test-${this.id}`);
        this.interactionsBlock = this.rootElement.find('.test-interactions');

        this.addInteractionBtn = this.rootElement.find('.addInteractionBtn');
        this.addInteractionBtn.click( () => {
            this.addInteraction();
        });


        this.runTestBtn = this.rootElement.find('.runTestBtn');
        this.runTestBtn.click( () => {
            this.run();
        });

        // create first interaction
        this.addInteraction();
    }


    run() {
        console.log('running test', this.id);
        if (this.testInteractions.length < 1) {
            console.error('no interactions to test');
            return;
        }
        //this.testInteractions[0].runInteraction();

        this.testInteractions.map((interaction) => {
            interaction.deleteAllResponses();
        });

        console.log('tis',this.testInteractions);

        this.testInteractions.reduce( (cur, next) => {
            console.log('cur is', cur);
            console.log('next is', next);
            return cur.runInteraction().then( () => next.runInteraction());

        });
    }

}

module.exports = Test;
