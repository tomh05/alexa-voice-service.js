'use strict';
import $ from 'jquery';
import Response from './response';

class TestInteraction {
    constructor(options) {
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
            <p><button class="recordButton">${this.recordButtonText}</button>
            or
            <input class="uploadAudio" type="file" />
            </p>
            <button class="playButton" disabled><i class="fas fa-play"></i> Play audio</button>
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

        this.nameElement.on('input', (e) => {
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


        this.uploadAudio = this.rootElement.find('.uploadAudio');

        this.uploadAudio.change((e) => {
            const file = e.target.files[0]; // FileList object
            var reader = new FileReader();
            reader.onload = (ev) => {
                return this.processRecording(new DataView(ev.target.result));
            };
            reader.readAsArrayBuffer(e.target.files[0]);
        });

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

    runInteraction() {
        console.log('running interaction', this.inputSpeechData);

        this.cleanupPreviousRun();

        console.log('sending speech data', this.inputSpeechData);
        return avs.sendAudio(this.inputSpeechData)
            .then(({xhr, response}) => {

                let expectingSpeech = false;
                var promises = [];
                var audioMap = {};
                var directives = [];

                if (response.multipart.length) {
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

                            //promises.push(avs.player.enqueue(slicedBody));
                            audioMap[multipart.headers['Content-ID']] = slicedBody;
                        } else {
                            log('unrecognised header:' + multipart.headers['Content-Type']);

                        }
                    });

                    function findAudioFromContentId(contentId) {
                        contentId = contentId.replace('cid:', '');
                        for (var key in audioMap) {
                            if (key.indexOf(contentId) > -1) {
                                return audioMap[key];
                            }
                        }
                    }

                    console.log('directive', directives);
                    directives.forEach(directive => {
                        if (directive.header.namespace === 'SpeechSynthesizer') {
                            if (directive.header.name === 'Speak') {
                                console.log('got speeech!');
                                const contentId = directive.payload.url;
                                const audio = findAudioFromContentId(contentId);
                                if (audio) {
                                    console.log('audio is', audio);
                                    //avs.audioToBlob(audio)
                                    //    .then(blob => logAudioBlob(blob, 'RESPONSE'));
                                    this.addResponse(directive, audio);
                                    //promises.push(avs.player.enqueue(audio));
                                }
                            }
                        } else if (directive.header.namespace === 'AudioPlayer') {
                            console.log('got audio player request')
                            console.log('directive is', directive);
                            if (directive.header.name === 'Play') {
                                console.log('got play request');

                                this.addResponse(directive, audio);
                                const stream = directive.payload.audioItem.stream;
                                //streams.forEach(stream => {
                                    const streamUrl = stream.url;

                                    const audio = findAudioFromContentId(streamUrl);
                                    if (audio) {
                                        avs.audioToBlob(audio)
                                            .then(blob => logAudioBlob(blob, 'RESPONSE'));
                                        //promises.push(avs.player.enqueue(audio));
                                    } else if (streamUrl.indexOf('http') > -1) {
                                        const xhr = new XMLHttpRequest();
                                        //const url = `/parse-m3u?url=${streamUrl.replace(/!.*$/, '')}`;
                                        /*
                                        xhr.open('GET', url, true);
                                        xhr.responseType = 'json';
                                        xhr.onload = (event) => {
                                            const urls = event.currentTarget.response;

                                            urls.forEach(url => {
                                                avs.player.enqueue(url);
                                            });
                                        };
                                        xhr.send();
                                        */
                                    }
                                //});
                            }
                        } else if (directive.header.namespace === 'SpeechRecognizer') {
                            if (directive.header.name === 'ExpectSpeech') {
                                const timeout = directive.payload.timeoutInMilliseconds;
                                expectingSpeech = true;
                            }
                        } else {
                            console.warn('unhandled directive:', directive); 
                        }
                    });

                    /*
                 if (promises.length) {
                     Promise.all(promises)
                         .then(() => {
                             avs.player.playQueue();
                         });
                 }
                 */
                }

                this.outgoingBubble.removeClass('loading');
                return {expectingSpeech: expectingSpeech };
            })
            .catch(error => {
                console.error(error);
            });
    }

    audioDataToString(audio)  {
        return String.fromCharCode.apply(null, new Uint8Array(audio));
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
