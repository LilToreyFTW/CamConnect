class VideoChat {
    constructor() {
        this.socket = null;
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.currentPartner = null;
        this.userId = null;
        this.token = localStorage.getItem('token');
        
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
    }

    async init() {
        if (!this.token) {
            this.showAuthModal();
            return;
        }

        try {
            // Connect to socket
            this.socket = io();
            
            // Get user info
            const user = await this.getCurrentUser();
            this.userId = user.id;
            
            // Setup socket listeners
            this.setupSocketListeners();
            
            // Join with user ID
            this.socket.emit('join', this.userId);
            
            // Get local stream
            await this.getLocalStream();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showAuthModal();
        }
    }

    async getCurrentUser() {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        
        return await response.json();
    }

    async getLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
            }
        } catch (error) {
            console.error('Error getting local stream:', error);
            alert('Please allow camera and microphone access to use video chat');
        }
    }

    setupSocketListeners() {
        this.socket.on('partner-found', async (data) => {
            console.log('Partner found:', data);
            this.currentPartner = data;
            await this.connectToPartner(data.socketId);
        });

        this.socket.on('no-partner', () => {
            console.log('No partner available');
            this.showSearching();
        });

        this.socket.on('offer', async (data) => {
            await this.handleOffer(data.offer, data.sender);
        });

        this.socket.on('answer', async (data) => {
            await this.handleAnswer(data.answer);
        });

        this.socket.on('ice-candidate', async (data) => {
            await this.handleIceCandidate(data.candidate);
        });

        this.socket.on('partner-left', () => {
            this.handlePartnerLeft();
        });

        this.socket.on('ready-for-next', () => {
            this.showReadyForNext();
        });
    }

    async connectToPartner(socketId) {
        this.peerConnection = new RTCPeerConnection(this.config);

        // Add local stream
        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            const remoteVideo = document.getElementById('remote-video');
            if (remoteVideo) {
                remoteVideo.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    target: socketId,
                    candidate: event.candidate
                });
            }
        };

        // Create offer
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        
        this.socket.emit('offer', {
            target: socketId,
            offer: offer
        });

        this.showConnected();
    }

    async handleOffer(offer, sender) {
        this.peerConnection = new RTCPeerConnection(this.config);

        // Add local stream
        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            const remoteVideo = document.getElementById('remote-video');
            if (remoteVideo) {
                remoteVideo.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    target: sender,
                    candidate: event.candidate
                });
            }
        };

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        this.socket.emit('answer', {
            target: sender,
            answer: answer
        });

        this.showConnected();
    }

    async handleAnswer(answer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async handleIceCandidate(candidate) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }

    findPartner() {
        const user = JSON.parse(localStorage.getItem('user'));
        this.socket.emit('find-partner', {
            gender: user?.gender,
            isPremium: user?.isPremium
        });
        this.showSearching();
    }

    nextPartner() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo) {
            remoteVideo.srcObject = null;
        }
        
        this.socket.emit('next');
        this.findPartner();
    }

    handlePartnerLeft() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo) {
            remoteVideo.srcObject = null;
        }
        
        this.currentPartner = null;
        this.showPartnerLeft();
    }

    showSearching() {
        const status = document.getElementById('chat-status');
        if (status) {
            status.textContent = 'Searching for partner...';
            status.className = 'searching';
        }
    }

    showConnected() {
        const status = document.getElementById('chat-status');
        if (status) {
            status.textContent = 'Connected';
            status.className = 'connected';
        }
    }

    showPartnerLeft() {
        const status = document.getElementById('chat-status');
        if (status) {
            status.textContent = 'Partner left';
            status.className = 'disconnected';
        }
    }

    showReadyForNext() {
        const status = document.getElementById('chat-status');
        if (status) {
            status.textContent = 'Ready for next';
            status.className = 'ready';
        }
    }

    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return false;
    }

    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return false;
    }

    disconnect() {
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Initialize video chat when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.videoChat = new VideoChat();
    
    // Start button
    const startBtn = document.getElementById('start-chat');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.videoChat.init();
        });
    }
    
    // Next button
    const nextBtn = document.getElementById('next-partner');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            window.videoChat.nextPartner();
        });
    }
    
    // Video toggle
    const videoToggle = document.getElementById('toggle-video');
    if (videoToggle) {
        videoToggle.addEventListener('click', () => {
            const enabled = window.videoChat.toggleVideo();
            videoToggle.textContent = enabled ? 'Video On' : 'Video Off';
            videoToggle.className = enabled ? 'btn active' : 'btn inactive';
        });
    }
    
    // Audio toggle
    const audioToggle = document.getElementById('toggle-audio');
    if (audioToggle) {
        audioToggle.addEventListener('click', () => {
            const enabled = window.videoChat.toggleAudio();
            audioToggle.textContent = enabled ? 'Audio On' : 'Audio Off';
            audioToggle.className = enabled ? 'btn active' : 'btn inactive';
        });
    }
});
