'use strict';
const Test = require('./test');
import $ from 'jquery';

class TestManager {
    constructor(options = {}) {
        this.tests = [];
        this.testManagerDiv = $('#test-blocks');
        console.log('testmanagerdiv is', this.testManagerDiv);
        this.runAllBtn = $('#runAll');
        console.log('runAll is', this.runAllBtn);
        this.addTest();

        this.runAllBtn.click(() => {
            
            console.log('clicky');
            this.runAll()});
    }

    addTest() {
        const newId = this.tests.length;
        const newTest = new Test(newId);
        newTest.createDomElements(this.testManagerDiv);
        this.tests.push(newTest);
    }

    runAll() {
        console.log('running all tests', this.id);
        if (this.tests.length < 1) {
            console.error('no tests to run!');
            return;
        }

        //this.clearPreviousTestResults();


        return this.tests.reduce( (previousTest, currentTest, index) => {
            console.log('previousTest is', previousTest);
            return previousTest.then( (result) => 
                {
                    console.log('result is', result);
                    return currentTest.run();



                }).catch( (error) => {
                    //currentTest.rootElement.after(`<div class='error'><i class="fas fa-exclamation-triangle"></i> ${error}</div>`);
                    for (let i = index + 1; i < this.tests.length; i++) {
                        this.tests[i].markSkipped();
                    }
                    throw error;
                });

        }, Promise.resolve())
            .then(() => {
                console.log("All tests passed");
            })
            .catch((e) => {

                console.error("failed to run all tests",e);
            } );
    }







}

module.exports = TestManager;
