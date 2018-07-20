'use strict';
import $ from 'jquery';
import Response from './response';

class TestInteraction {
  constructor(id) {
      this.id = id;
      this.isRecording = false;
      this.hasAudio = false;
      this.recordButtonText = "Record using Mic";
      this.inputSpeechData = null;
      this.responses = [];
  }

    addInteraction() {
        console.log('a:this',this);

    }


    createDomElements(target) {
        // TODO: sort out naming convention, so we don't get wrong interaction from another test!
        target.append(`
            <div class="test-interaction-block" id="test-${this.id}">
            <div>
            <h2 contentEditable="true">Interaction_${this.id}</h2>
            <span class="hint">(click to rename)</span>
            </div>
            <p><button class="recordButton">${this.recordButtonText}</button>
            or
            <input class="uploadAudio" type="file" />
            </p>
            <button class="playButton" disabled>Play audio</button>
            <div class="responses"> </div>
            </div>
            `);

        this.rootElement = $(`#test-${this.id}`);

        this.recordButton = this.rootElement.find('.recordButton');
        this.responseDiv = this.rootElement.find('.responses');

        this.recordButton.click( () => {
            if (!this.isRecording) {

            console.log('record', this.id);
            // disable all record buttons
            $('.recordButton').attr('disabled', 'disabled');
            this.recordButton.text('Stop recording');
            this.recordButton.removeAttr('disabled');
                this.isRecording = true;
            window.avs.startRecording();


            } else {
            this.recordButton.text('Record');
            $('.recordButton').removeAttr('disabled');
            this.recordButton.text(this.recordButtonText);
            this.isRecording = false;
            window.avs.stopRecording().then((data) => this.processRecording(data));
            }
        });

        this.playButton = this.rootElement.find('.playButton');

        this.playButton.click( () => {
            if (this.inputSpeechData !== null) {
                console.log('playing',this.inputSpeechData);
                const copyOfAudio = new DataView(this.inputSpeechData.buffer.slice(0));
                window.avs.player.enqueue(copyOfAudio) // play it back to the user
                    .then(() => window.avs.player.play());
            }
        });


        this.uploadAudio = this.rootElement.find('.uploadAudio');

        this.uploadAudio.change((e) => {
            const file = e.target.files[0]; // FileList object
            console.log('file is', file);

            var reader = new FileReader();
            reader.onload = (ev) => {
                console.log('loading done');
                return this.processRecording ( new DataView(ev.target.result));
                /*
        avs.fileToBuffer(ev.target.result).then( (audioBuffer) => {

            return processRecording ( new DataView(audioBuffer));

    })
        */
    };

	reader.readAsArrayBuffer(e.target.files[0]);
});

    }

    processRecording(recordedData) {
        console.log('processing recording', recordedData);
        this.inputSpeechData = recordedData;
        this.playButton.removeAttr('disabled');
    }

    deleteAllResponses() {
     this.responses = [];
     this.responseDiv.html('');
    }

    addResponse(payload, audio) {
        console.log('adding response');
        const newId = this.responses.length;
        const newResponse = new Response(newId, payload, audio);
        newResponse.createDomElements(this.responseDiv);
        this.responses.push(newResponse);
    }

 runInteraction() {
     console.log('running interaction', this.inputSpeechData);


     this.deleteAllResponses();

     //const copyOfAudio = new DataView(this.inputSpeechData.buffer.slice(0));
     return avs.sendAudio(this.inputSpeechData)
         .then(({xhr, response}) => {

             var promises = [];
             var audioMap = {};
             var directives = [];

             if (response.multipart.length) {
                 response.multipart.forEach(multipart => {
                     let body = multipart.body;
                     if (multipart.headers && multipart.headers['Content-Type'].includes('application/json')) {
                         try {
                             body = JSON.parse(body);
                             log(JSON.stringify(body, null, 4));
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
                         console.log('audiomap is', audioMap);
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
                         if (directive.header.name === 'play') {
                             const streams = directive.payload.audioItem.streams;
                             streams.forEach(stream => {
                                 const streamUrl = stream.streamUrl;

                                 const audio = findAudioFromContentId(streamUrl);
                                 if (audio) {
                                     avs.audioToBlob(audio)
                                         .then(blob => logAudioBlob(blob, 'RESPONSE'));
                                     promises.push(avs.player.enqueue(audio));
                                 } else if (streamUrl.indexOf('http') > -1) {
                                     const xhr = new XMLHttpRequest();
                                     //const url = `/parse-m3u?url=${streamUrl.replace(/!.*$/, '')}`;
                                     xhr.open('GET', url, true);
                                     xhr.responseType = 'json';
                                     xhr.onload = (event) => {
                                         const urls = event.currentTarget.response;

                                         urls.forEach(url => {
                                             avs.player.enqueue(url);
                                         });
                                     };
                                     xhr.send();
                                 }
                             });
                         }
                     } else if (directive.header.namespace === 'SpeechRecognizer') {
                         if (directive.header.name === 'ExpectSpeech') {
                             const timeout = directive.payload.timeoutInMilliseconds;
                             // enable mic
                             console.log('expecting response!');
                             return Promise.resolve('next interaction');
                             //avs.startRecording();
                         }
                     } else {
                         console.warn('unhandled directive:', directive); 
                     }
                 });

                 if (promises.length) {
                     Promise.all(promises)
                         .then(() => {
                             avs.player.playQueue();
                         });
                 }
             }
         })
         .catch(error => {
             console.error(error);
         });
 }





}




module.exports = TestInteraction;
