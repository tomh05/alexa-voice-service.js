'use strict';
const TestInteraction = require('./testinteraction');
import $ from 'jquery';

class Test {
    constructor(id) {
        this.id = id;
        this.testInteractions = [];
    }

    addInteraction() {
        console.log('adding interaction');
        const newId = this.testInteractions.length;
        const newInteraction = new TestInteraction(newId);

        newInteraction.createDomElements(this.interactionsBlock);
        this.testInteractions.push(newInteraction);
    }

    createDomElements(target) {
        target.append(`
            <div class="test-block test-${this.id}">
            <div>
            <h1 contentEditable="true">Test_${this.id}</h1>
            <span class="hint">(click to rename)</span>
            </div>
            <button class="runTestBtn">Run Test</button>
            <div class="test-interactions"> </div>
            <button class="addInteractionBtn bubble"> <i class="fas fa-plus-circle"></i> Add Interaction</button>

            </div>
            `);

        this.rootElement = target.find(`.test-${this.id}`);
        this.interactionsBlock = this.rootElement.find('.test-interactions');

        this.addInteractionBtn = this.rootElement.find('.addInteractionBtn');
        console.log(this.rootElement);
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

    clearPreviousTestResults() {
        this.interactionsBlock.find('.error').remove();
        this.testInteractions.map((interaction) => {
            interaction.deleteAllResponses();
        });
        this.rootElement.find('.error').html('');
    }

    markSkipped() {
        this.rootElement.addClass('skipped');
    }
    run() {

        this.rootElement.removeClass('skipped');
        console.log('running test', this.id);
        if (this.testInteractions.length < 1) {
            console.error('no interactions to test');
            return;
        }

        this.clearPreviousTestResults();


        return this.testInteractions.reduce( (previousInteraction, currentInteraction, index) => {
            console.log('previousInteraction is', previousInteraction);
            return previousInteraction.then( (result) => 
                {
                    console.log('previous interaction returned', result);
                    console.log('currentInteraciton is', currentInteraction);

                    if (result.expectingSpeech === true) {
                        // if result includes an ExpectSpeech run next interaction
                        return currentInteraction.runInteraction();
                    } else if (result.expectingSpeech === false) {
                        // TODO
                        // if result doesn't include an ExpectSpeech but there is a 'next', warn user
                        currentInteraction.rootElement.before(`<div class='error bubble'><i class="fas fa-exclamation-triangle"></i> Alexa ended the conversation.</div>`);

                        for (let i = index; i < this.testInteractions.length; i++) {
                            this.testInteractions[i].markSkipped();
                        }
                        return Promise.reject('ALEXA_ENDED_CONVERSATION');
                    } else {
                        console.log('uncaught');
                    }

                });

        }, Promise.resolve({expectingSpeech: true}))
            .then((finalResult) => {
                if (finalResult && finalResult.expectingSpeech === true) {
                        this.interactionsBlock.append(`<div class='error bubble'><i class="fas fa-exclamation-triangle"></i> Alexa expected you to respond, but you didn't provide a response.</div>`);
                            return Promise.reject();
                        return Promise.reject('NOT_ENOUGH_INTERACTIONS');
                } else {

                            return Promise.resolve();
                }
            });
    }
}

module.exports = Test;
