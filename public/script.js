const socket = io("/");

const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
// myVideo.muted = true;
const peers = {}

const peer = new Peer(undefined, {
  path: '/peer',
  host: '/',
  port: '3030'
});

let myVideoStream;
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  peer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  });

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream);
  })

  document.getElementById('chat_message')
    .addEventListener('keydown', (e) => {
    if (e.keyCode === 13 && e.target.value) {
      socket.emit('message', e.target.value);
      e.target.value = '';
    }
  });
  
  document.getElementById('leave_meeting')
    .addEventListener('click', () => {
      console.log('leaving meeting')
    socket.emit('leave-room');
  });

  socket.on("createMessage", message => {
    document.getElementById('messages')
      .innerHTML += `<li class="message">
      <b>user</b><br/>${message}
      </li>`;
    scrollToBottom()
  })

})

socket.on('user-disconnected', userId => {
  console.log('disconnecting')
  if (peers[userId]) peers[userId].close()
})

peer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  })
  videoGrid.append(video);
}

const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}