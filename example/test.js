'use strict';
const TestInteraction = require('./testinteraction');
import $ from 'jquery';

class Test {
    constructor(rootDomElement, options) {
        this.id = options.id;
        this.name = options.name ? options.name : `Test_${this.id}`;
        this.createDomElements(rootDomElement);
        this.testInteractions = [];
        
        if (options.testInteractions) {
            options.testInteractions.map((interaction) => this.addInteraction(interaction));
        } else {
            this.addInteraction();
        }
    }

    addInteraction(options) {
        if (!options) {
            let newId = 0;
            if (this.testInteractions.length > 0) {
                const lastInteraction = this.testInteractions[this.testInteractions.length - 1];
                newId = lastInteraction.id + 1;
            }
            options = {
                id: newId
            };
        }
        const newInteraction = new TestInteraction(this, options);

        newInteraction.createDomElements(this.interactionsBlock);
        this.testInteractions.push(newInteraction);
    }
    
    notifyDestroyed(id) {
        // remove the interaction with matching ID from our array
        this.testInteractions.splice(this.testInteractions.findIndex(item => item.id === id), 1);
    }

    createDomElements(target) {
        target.append(`
            <div class="test-block test-${this.id}">
            <div class="test-header">
            <div>
            <h1 class='name' contentEditable="true">${this.name}</h1>
            <span class="hint">(click to rename)</span>
            </div>
            <button class="runTestBtn"><i class="fas fa-vial"></i> Run Test</button>
            <button class="delete"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="test-interactions"> </div>
            <button class="addInteractionBtn bubble"> <i class="fas fa-plus-circle"></i> Add Interaction</button>

            </div>
            `);

        this.rootElement = target.find(`.test-${this.id}`);
        this.interactionsBlock = this.rootElement.find('.test-interactions');

        this.nameElement = this.rootElement.find('.name');

        this.nameElement.on('input', (e) => {
            this.name = this.nameElement.text();
        });
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
        //this.addInteraction();
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

                            return Promise.reject('NOT_ENOUGH_INTERACTIONS');
                } else {

                            return Promise.resolve();
                }
            });
    }

    toObject() {
        return {
            id: this.id,
            name: this.name,
            testInteractions: this.testInteractions.map( (testInteraction) => testInteraction.toObject() )
        };
    }
}

module.exports = Test;
