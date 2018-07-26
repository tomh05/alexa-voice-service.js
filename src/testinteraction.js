'use strict';
import $ from 'jquery';
import Response from './response';
import Dropzone from 'dropzone';

class TestInteraction {
    constructor(parent, options) {
        this.parent = parent;
        this.id = options.id;
        this.isRecording = false;
        this.hasAudio = false;
        this.recordButtonText = '<i class="fas fa-microphone"></i> Record using Mic';
        this.inputSpeechData = options.speech ? this.stringToAudioData(options.speech) : null;
        this.responses = [];
        this.name = options.name ? options.name : `Interaction_${this.id}`;
    }

    createDomElements(target) {
        target.append(`
            <div class="test-interaction-block test-interaction-${this.id}">
            <div class="outgoing bubble">
            <div class="header">
                <h2 class="name" contentEditable="true">${this.name}</h2>
                <span class="hint">(click to rename)</span>
            </div>
            <div><button class="recordButton">${this.recordButtonText}</button>
            or
            <div class="dropzone"> </div>
            </div>
            <button class="playButton" disabled><i class="fas fa-play"></i> Play audio</button>
            <button class="delete"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="responses bubble"> </div>
            </div>
            `);

        this.rootElement = target.find(`.test-interaction-${this.id}`);

        this.recordButton = this.rootElement.find('.recordButton');
        this.responseDiv = this.rootElement.find('.responses');
        this.header = this.rootElement.find('.header');
        this.outgoingBubble = this.rootElement.find('.outgoing');

        this.nameElement = this.rootElement.find('.name');

        this.nameElement.on('input', () => {
            this.name = this.nameElement.text();
        });

        this.recordButton.click( () => {
            if (!this.isRecording) {

                // disable all record buttons
                $('.recordButton').attr('disabled', 'disabled');
                this.recordButton.html('<i class="fas fa-stop"></i> Stop recording');
                this.recordButton.removeAttr('disabled');
                this.isRecording = true;
                window.avs.startRecording();


            } else {
                this.recordButton.text('Record');
                $('.recordButton').removeAttr('disabled');
                this.recordButton.html(this.recordButtonText);
                this.isRecording = false;
                window.avs.stopRecording().then((data) => this.processRecording(data));
            }
        });

        this.playButton = this.rootElement.find('.playButton');

        this.playButton.click( () => {
            if (this.inputSpeechData !== null) {
                const copyOfAudio = new DataView(this.inputSpeechData.buffer.slice(0));
                window.avs.player.enqueue(copyOfAudio) // play it back to the user
                    .then(() => window.avs.player.play());
            }
        });

        if (this.inputSpeechData) {
            this.playButton.removeAttr('disabled');
        }

        const self = this;
        this.dropzoneElement = this.rootElement.find('.dropzone');
        this.dropzone = new Dropzone(this.dropzoneElement[0],{
            url: '/not-used',
            dictDefaultMessage: '<i class="far fa-file-audio"></i> Upload a wav file',
            acceptedFiles: 'audio/wav',
            init: function() {
                // override 'file added' event to check its type and process it as a recording
                this.on("addedfile", function() {
                    if (this.files[0]!=null) {
                        const file = this.files[0];
                        if (file.type === 'audio/wav') {
                            var reader = new FileReader();
                            reader.onload = (ev) => {
                                return self.processRecording(new DataView(ev.target.result));
                            };
                            reader.readAsArrayBuffer(file);
                        } else {
                            alert('File must be WAV, 16kHz, single channel, 16bit Linear PCM, little endian.')
                        }
                        this.removeFile(this.files[0]);
                    }
                });
            }
        });

        this.deleteBtn = this.rootElement.find('.delete');
        this.deleteBtn.click( () => {
            if (confirm('delete interaction?')) {
                this.destroy();
            }
        });
    }

    destroy() {
        this.deleteAllResponses();
        this.rootElement.remove();
        this.parent.notifyInteractionDestroyed(this.id);
    }

    processRecording(recordedData) {
        console.log('processing recording', recordedData);
        this.inputSpeechData = recordedData;
        this.playButton.removeAttr('disabled');
    }

    markSkipped() {
        this.rootElement.addClass('skipped');
    }

    deleteAllResponses() {
        this.responses = [];
        this.responseDiv.html('');
    }

    addResponse(directive, audio) {
        console.log('adding response');
        const newId = this.responses.length;
        const newResponse = new Response(newId, directive, audio);
        newResponse.createDomElements(this.responseDiv);
        this.responses.push(newResponse);
    }

    cleanupPreviousRun() {
        this.deleteAllResponses();
        this.rootElement.removeClass('skipped');
        this.outgoingBubble.addClass('loading');
    }

    findAudioFromContentId(audioMap, contentId) {
        contentId = contentId.replace('cid:', '');
        for (var key in audioMap) {
            if (key.indexOf(contentId) > -1) {
                return audioMap[key];
            }
        }
    }



    runInteraction() {
        console.log('running interaction', this.inputSpeechData);

        this.cleanupPreviousRun();

        console.log('sending speech data', this.inputSpeechData);
        return window.avs.sendAudio(this.inputSpeechData)
            .then(({xhr, response}) => {

                console.log('response',response);
                let expectingSpeech = false;
                var audioMap = {};
                var directives = [];

                if (response.multipart && response.multipart.length) {
                    response.multipart.forEach(multipart => {
                        let body = multipart.body;
                        if (multipart.headers && multipart.headers['Content-Type'].includes('application/json')) {
                            try {
                                body = JSON.parse(body);
                                //.log(JSON.stringify(body, null, 4));
                            } catch(error) {
                                console.error(error);
                            }

                            if (body && body.directive) {
                                directives.push(body.directive);
                            }
                        } else if (multipart.headers['Content-Type'] === 'application/octet-stream') {
                            const start = multipart.meta.body.byteOffset.start;
                            const end = multipart.meta.body.byteOffset.end;

                            /**
                             * Not sure if bug in buffer module or in http message parser
                             * because it's joining arraybuffers so I have to this to
                             * seperate them out.
                             */
                            var slicedBody = xhr.response.slice(start, end);
                            audioMap[multipart.headers['Content-ID']] = slicedBody;
                        } else {
                            console.log('unrecognised header:' + multipart.headers['Content-Type']);

                        }
                    });

                    console.log('directive', directives);
                    directives.forEach(directive => {
                        if (directive.header.namespace === 'SpeechSynthesizer') {
                            if (directive.header.name === 'Speak') {
                                console.log('got speeech!');
                                const contentId = directive.payload.url;
                                const audio = this.findAudioFromContentId(audioMap, contentId);
                                if (audio) {
                                    console.log('audio is', audio);
                                    //avs.audioToBlob(audio)
                                    //    .then(blob => logAudioBlob(blob, 'RESPONSE'));
                                    this.addResponse(directive, audio);
                                    //promises.push(avs.player.enqueue(audio));
                                }
                            }
                        } else if (directive.header.namespace === 'AudioPlayer') {
                            //if (directive.header.name === 'Play') {
                            this.addResponse(directive, null);
                            //}
                        } else if (directive.header.namespace === 'SpeechRecognizer') {
                            if (directive.header.name === 'ExpectSpeech') {
                                expectingSpeech = true;
                            }
                        } else {
                            console.warn('unhandled directive:', directive);
                        }
                    });
                }

                this.outgoingBubble.removeClass('loading');
                return {expectingSpeech: expectingSpeech };
            })
            .catch(error => {
                console.error(error);
                this.outgoingBubble.removeClass('loading');
                throw error;
            });
    }

    audioDataToString(audio)  {
        let binaryString = '',
            bytes = new Uint8Array(audio),
            length = bytes.length;
        for (var i = 0; i < length; i++) {
            binaryString += String.fromCharCode(bytes[i]);
        }
        return binaryString;
    }

    stringToAudioData(string)  {
        const buf = new ArrayBuffer(string.length); // *2, 2 bytes for each char
        const bufView = new Uint8Array(buf);
        for (var i=0, strLen=string.length; i < strLen; i++) {
            bufView[i] = string.charCodeAt(i);
        }
        return new DataView(buf);
    }

    toObject() {
        return {
            id: this.id,
            name: this.name,
            speech: this.audioDataToString(this.inputSpeechData.buffer)
        };
    }
}

module.exports = TestInteraction;
