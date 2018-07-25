'use strict';
const Test = require('./test');
import $ from 'jquery';
import { saveAs } from 'file-saver/FileSaver';


class TestManager {
    constructor() {
        this.tests = [];
        this.testManagerDiv = $('#test-blocks');
        console.log('testmanagerdiv is', this.testManagerDiv);
        this.runAllBtn = $('#runAll');
        console.log('runAll is', this.runAllBtn);
        this.addTest();

        this.runAllBtn.click(() => {
            this.runAll();
        });

        this.saveBtn = $('#save');
        this.saveBtn.click(() => {
            this.exportToDownload();
        });

        this.loadBtn = $('#load');
        this.loadBtn.click(() => {
            console.log('clicked load button');
            $('#upload-file').click();
        });

        $('#upload-file').change(() => {
            console.log('uploading');
            this.importFromUpload();
        });
    }

    exportToDownload() {
        const blob = new Blob([JSON.stringify(this.toObject())], {type: 'application/json'});
        saveAs(blob, 'test_suite.json');
    }

    importFromUpload() {
        console.log('uploading!');
        const newFile = $('#upload-file').prop('files')[0];
        if (newFile) {
            const fileReader = new FileReader();
            fileReader.onload = () => {
                if (fileReader.result) {
                    const loadedData = JSON.parse(fileReader.result);
                    this.fromObject(loadedData);
                }
            };
            fileReader.readAsText(newFile);
        }
    }

    addTest(options) {
        if (!options) {
            let newId = 0;
            if (this.tests.length > 0) {
                const lastTest = this.tests[this.tests.length - 1];
                newId = lastTest.id + 1;
            }
            options = {
                id: newId
            };
        }

        const newTest = new Test(this, options);
        //newTest.createDomElements(this.testManagerDiv);
        this.tests.push(newTest);
    }

    notifyTestDestroyed(id) {
        // remove the test with matching ID from our array
        this.tests.splice(this.tests.findIndex(item => item.id === id), 1);
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
            return previousTest.then( (result) => {
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
                console.log('All tests passed');
            })
            .catch((e) => {
                console.error('failed to run all tests', e);
            } );
    }


    toObject() {
        return {
            tests: this.tests.map( (test) => test.toObject() )
        };
    }

    fromObject(loadedData) {
        this.tests = [];
        this.testManagerDiv.html('');
        for (let i=0; i< loadedData.tests.length; i++) {
            this.addTest(loadedData.tests[i]);
        }

    }

}

module.exports = TestManager;
