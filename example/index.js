const AVS = require('../');
const TestManager = require('./testManager');
const player = AVS.Player;

const testManager = new TestManager();

const avs = new AVS({
  debug: true,
  clientId: 'amzn1.application-oa2-client.24610b975ef74e57a9a32307d35c28fc',
  deviceId: 'testdevice',
  deviceSerialNumber: 123,
  redirectUri: `https://${window.location.host}/authresponse`
});
window.avs = avs;

avs.on(AVS.EventTypes.TOKEN_SET, () => {
  loginBtn.disabled = true;
  logoutBtn.disabled = false;
  startRecording.disabled = false;
  stopRecording.disabled = true;
  log("Token Set");
});

avs.on(AVS.EventTypes.RECORD_START, () => {
  startRecording.disabled = true;
  stopRecording.disabled = false;
  log("Record Start");
});

avs.on(AVS.EventTypes.RECORD_STOP, () => {
  startRecording.disabled = false;
  stopRecording.disabled = true;
});

avs.on(AVS.EventTypes.LOGOUT, () => {
  loginBtn.disabled = false;
  logoutBtn.disabled = true;
  startRecording.disabled = true;
  stopRecording.disabled = true;
});

avs.on(AVS.EventTypes.TOKEN_INVALID, () => {
  avs.logout()
  .then(login)
});

avs.on(AVS.EventTypes.LOG, log);
avs.on(AVS.EventTypes.ERROR, logError);

avs.player.on(AVS.Player.EventTypes.LOG, log);
avs.player.on(AVS.Player.EventTypes.ERROR, logError);

avs.player.on(AVS.Player.EventTypes.PLAY, () => {
  playAudio.disabled = true;
  replayAudio.disabled = true;
  pauseAudio.disabled = false;
  stopAudio.disabled = false;
});

avs.player.on(AVS.Player.EventTypes.ENDED, () => {
  playAudio.disabled = true;
  replayAudio.disabled = false;
  pauseAudio.disabled = true;
  stopAudio.disabled = true;
});

avs.player.on(AVS.Player.EventTypes.STOP, () => {
  playAudio.disabled = true;
  replayAudio.disabled = false;
  pauseAudio.disabled = false;
  stopAudio.disabled = false;
});

avs.player.on(AVS.Player.EventTypes.PAUSE, () => {
  playAudio.disabled = false;
  replayAudio.disabled = false;
  pauseAudio.disabled = true;
  stopAudio.disabled = true;
});

avs.player.on(AVS.Player.EventTypes.REPLAY, () => {
  playAudio.disabled = true;
  replayAudio.disabled = true;
  pauseAudio.disabled = false;
  stopAudio.disabled = false;
});

function log(message) {
  logOutput.innerHTML = `<pre>${message}</pre>` + logOutput.innerHTML;
  //logOutput.innerHTML = `<li>LOG: <pre>${message}</pre></li>` + logOutput.innerHTML;
}

function logError(error) {
  logOutput.innerHTML = `<li>ERROR: ${error}</li>` + logOutput.innerHTML;
}

function logAudioBlob(blob, message) {
  return new Promise((resolve, reject) => {
    const a = document.createElement('a');
    const aDownload = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    const ext = blob.type.indexOf('mpeg') > -1 ? 'mp3' : 'wav';
    const filename = `${Date.now()}.${ext}`;
    a.href = url;
    a.target = '_blank';
    aDownload.href = url;
    a.textContent = filename;
    aDownload.download = filename;
    aDownload.textContent = `download`;

    audioLogOutput.innerHTML = `<li>${message}: ${a.outerHTML} ${aDownload.outerHTML}</li>` +audioLogOutput.innerHTML;
    resolve(blob);
  });
}

const loginBtn = document.getElementById('login');
const logoutBtn = document.getElementById('logout');
const logOutput = document.getElementById('log');
const setLanguageBtn = document.getElementById('setLanguage');
const audioLogOutput = document.getElementById('audioLog');
const startRecording = document.getElementById('startRecording');
const stopRecording = document.getElementById('stopRecording');
const audioFileSelector = document.getElementById('audioFileSelector');
const stopAudio = document.getElementById('stopAudio');
const pauseAudio = document.getElementById('pauseAudio');
const playAudio = document.getElementById('playAudio');
const replayAudio = document.getElementById('replayAudio');

const addTest = document.getElementById('addTest');
console.log('playAudio is',playAudio);
console.log('addTest is',addTest);

addTest.addEventListener('click', () => testManager.addTest());
/*
// If using client secret
avs.getCodeFromUrl()
 .then(code => avs.getTokenFromCode(code))
.then(token => localStorage.setItem('token', token))
.then(refreshToken => localStorage.setItem('refreshToken', refreshToken))
.then(() => avs.requestMic())
.then(() => avs.refreshToken())
.catch(() => {

});
*/

avs.getTokenFromUrl()
.then(() => avs.getToken())
.then(token => localStorage.setItem('token', token))
.then(() => avs.requestMic())
.catch(() => {
  const cachedToken = localStorage.getItem('token');

  if (cachedToken) {
    avs.setToken(cachedToken);
    return avs.requestMic();
  }
});

loginBtn.addEventListener('click', login);

function login(event) {
  return avs.login()
  .then(() => avs.requestMic())
  .catch(() => {});

  /*
  // If using client secret
  avs.login({responseType: 'code'})
  .then(() => avs.requestMic())
  .catch(() => {});
  */
}

logoutBtn.addEventListener('click', logout);

function logout() {
  return avs.logout()
  .then(() => {
    localStorage.removeItem('token');
    window.location.hash = '';
  });
}


setLanguageBtn.addEventListener('click', setLanguage);

function setLanguage() {
  return avs.setLanguage()
  .then(() => {
      console.log('language set!');
  });
}

startRecording.addEventListener('click', () => {
  avs.startRecording();
});





stopRecording.addEventListener('click', (e) => {
    // use the 1st file from the list
    return avs.stopRecording().then(processRecording);
});


audioFileSelector.addEventListener('change', (e) => {
    const file = e.target.files[0]; // FileList object
    console.log('file is', file);

    var reader = new FileReader();
    reader.onload = function(ev) {
        console.log('loading done');
        return processRecording ( new DataView(ev.target.result));
        /*
        avs.fileToBuffer(ev.target.result).then( (audioBuffer) => {
            
            return processRecording ( new DataView(audioBuffer));

    })
        */
    };

	reader.readAsArrayBuffer(e.target.files[0]);
});
    
    
 function processRecording (dataView) {
     console.log('dataview is', dataView);

     avs.player.emptyQueue()
         .then(() => avs.audioToBlob(dataView))
         .then(blob => logAudioBlob(blob, 'VOICE'))
         .then(() => avs.player.enqueue(dataView)) // play it back to the user
         .then(() => avs.player.play())
         .catch(error => {
             console.error(error);
         });

     var ab = false;
     //sendBlob(blob);
     avs.sendAudio(dataView)
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

                         console.log('context is',body);
                         if (body && body.directive) {
                             directives.push(body.directive);
                         }
                     } else if (multipart.headers['Content-Type'] === 'application/octet-stream') {
                         console.log('got octet!');
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
                                 console.log('got audio!');
                                 avs.audioToBlob(audio)
                                     .then(blob => logAudioBlob(blob, 'RESPONSE'));
                                 promises.push(avs.player.enqueue(audio));
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
                             avs.startRecording();
                         }
                     } else {
                         console.warn('unhandled directive:', directive); 
                     }
                 });

                 if (promises.length) {
                     Promise.all(promises)
                         .then(() => {
                             avs.player.playQueue()
                         });
                 }
             }
         })
         .catch(error => {
             console.error(error);
         });
 }

stopAudio.addEventListener('click', (event) => {
    avs.player.stop();
});

pauseAudio.addEventListener('click', (event) => {
    avs.player.pause();
});

playAudio.addEventListener('click', (event) => {
    avs.player.play();
});

replayAudio.addEventListener('click', (event) => {
    avs.player.replay();
});

function sendBlob(blob) {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();

    fd.append('fname', 'audio.wav');
    fd.append('data', blob);

    xhr.open('POST', 'http://localhost:5555/audio', true);
    xhr.responseType = 'blob';

    xhr.onload = (event) => {
        if (xhr.status == 200) {
            console.log(xhr.response);
            //const responseBlob = new Blob([xhr.response], {type: 'audio/mp3'});
        }
    };

    xhr.send(fd);
}
