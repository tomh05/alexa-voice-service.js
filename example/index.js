'use strict';

const AVS = require('../');
const TestManager = require('./testManager');
import $ from 'jquery';

$(document).ready(() => {
    console.log('ready!');
    const testManager = new TestManager();

    const avs = new AVS({
        debug: true,
        clientId: 'amzn1.application-oa2-client.24610b975ef74e57a9a32307d35c28fc',
        deviceId: 'testdevice',
        deviceSerialNumber: 123,
        redirectUri: `https://${window.location.host}/authresponse`
    });
    window.avs = avs;


    window.authCallback = (newHash) => {

        window.location.hash = newHash;

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
    };

    function login() {
        console.log('logging in');
        return avs.login({responseType: 'token', newWindow: true})
            .then(() => avs.requestMic())
            .catch(() => {});

        /*
        // If using client secret
  avs.login({responseType: 'code'})
  .then(() => avs.requestMic())
  .catch(() => {});
  */
    }
    function logout() {
        return avs.logout()
            .then(() => {
                localStorage.removeItem('token');
                window.location.hash = '';
            });
    }

    const loginBtn = document.getElementById('login');
    const logoutBtn = document.getElementById('logout');

    loginBtn.addEventListener('click', login);
    logoutBtn.addEventListener('click', logout);

    avs.on(AVS.EventTypes.TOKEN_SET, () => {
        loginBtn.disabled = true;
        logoutBtn.disabled = false;
        console.log('Token Set');
    });

    /*
avs.on(AVS.EventTypes.RECORD_START, () => {
  startRecording.disabled = true;
  stopRecording.disabled = false;
  log("Record Start");
});

avs.on(AVS.EventTypes.RECORD_STOP, () => {
  startRecording.disabled = false;
  stopRecording.disabled = true;
});

*/
    avs.on(AVS.EventTypes.LOGOUT, () => {
        loginBtn.disabled = false;
        logoutBtn.disabled = true;
    });

    avs.on(AVS.EventTypes.TOKEN_INVALID, () => {
        avs.logout()
            .then(login);
    });

    /*
avs.on(AVS.EventTypes.LOG, log);
avs.on(AVS.EventTypes.ERROR, logError);

avs.player.on(AVS.Player.EventTypes.LOG, log);
avs.player.on(AVS.Player.EventTypes.ERROR, logError);
*/

    /*
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

*/

    /*
function log(message) {
  logOutput.innerHTML = `<pre>${message}</pre>` + logOutput.innerHTML;
    //logOutput.innerHTML = `<li>LOG: <pre>${message}</pre></li>` + logOutput.innerHTML;
}

function logError(error) {
  logOutput.innerHTML = `<li>ERROR: ${error}</li>` + logOutput.innerHTML;
}
*/

    const addTest = document.getElementById('addTest');

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

    /*
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
*/

});
