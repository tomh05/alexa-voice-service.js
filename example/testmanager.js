'use strict';
const Test = require('./test');
import $ from 'jquery';

class TestManager {
    constructor(options = {}) {

        this.tests = [];
        this.testManagerDiv = $('#test-blocks');
        this.addTest();
    }

    addTest() {
        const newId = this.tests.length;
        const newTest = new Test(newId);
        newTest.createDomElements(this.testManagerDiv);
        this.tests.push(newTest);
    }
}

module.exports = TestManager;
