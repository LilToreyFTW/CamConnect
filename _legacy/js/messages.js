// CamConnect - Messages Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    loadConversations();
    setupEventListeners();
    initSocket();
});

let socket = null;
let currentConversation = null;
let currentUserId = null;

async function loadConversations() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch('/api/conversations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load conversations');
        }

        const conversations = await response.json();
        renderConversations(conversations);
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

function renderConversations(conversations) {
    const conversationsList = document.getElementById('conversations-list');
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = '<p class="no-conversations">No conversations yet</p>';
        return;
    }

    conversationsList.innerHTML = conversations.map(conv => {
        const profilePic = conv.photos?.find(p => p.isProfile) || conv.photos?.[0];
        const timeAgo = getTimeAgo(conv.lastMessageTime);
        
        return `
            <div class="conversation-item" data-user-id="${conv.userId}">
                <img src="${profilePic?.url || '/images/default-avatar.png'}" alt="${conv.username}" class="conversation-avatar">
                <div class="conversation-info">
                    <div class="conversation-header">
                        <span class="conversation-name">${conv.username}</span>
                        <span class="conversation-time">${timeAgo}</span>
                    </div>
                    <div class="conversation-preview">
                        <span class="last-message">${conv.lastMessage}</span>
                        ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
                    </div>
                </div>
                <span class="conversation-status ${conv.isOnline ? 'online' : 'offline'}"></span>
            </div>
        `;
    }).join('');

    // Add click handlers
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
            const userId = item.dataset.userId;
            openConversation(userId);
        });
    });
}

async function openConversation(userId) {
    currentUserId = userId;
    const token = localStorage.getItem('token');

    try {
        // Mark messages as read
        await fetch(`/api/messages/${userId}/read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Load messages
        const response = await fetch(`/api/messages/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load messages');
        }

        const messages = await response.json();
        renderChatArea(messages, userId);
        
        // Join socket room
        if (socket) {
            socket.emit('join-room', userId);
        }
    } catch (error) {
        console.error('Error opening conversation:', error);
    }
}

function renderChatArea(messages, userId) {
    const chatArea = document.getElementById('chat-area');
    
    // Get user info from conversation
    const conversationItem = document.querySelector(`[data-user-id="${userId}"]`);
    const username = conversationItem.querySelector('.conversation-name').textContent;
    const profilePic = conversationItem.querySelector('.conversation-avatar').src;

    chatArea.innerHTML = `
        <div class="chat-header">
            <img src="${profilePic}" alt="${username}" class="chat-avatar">
            <div class="chat-user-info">
                <h3>${username}</h3>
                <span class="chat-status online">Online</span>
            </div>
            <button class="btn btn-outline btn-small" id="send-gift">Send Gift</button>
        </div>
        <div class="chat-messages" id="chat-messages">
            ${messages.map(msg => createMessageElement(msg)).join('')}
        </div>
        <div class="chat-input-area">
            <input type="text" id="message-input" placeholder="Type a message..." />
            <button class="btn btn-primary" id="send-message">Send</button>
        </div>
    `;

    // Scroll to bottom
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Add event listeners
    document.getElementById('send-message').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Typing indicator
    document.getElementById('message-input').addEventListener('input', () => {
        if (socket) {
            socket.emit('typing', userId);
        }
    });

    document.getElementById('send-gift').addEventListener('click', () => {
        sendGift(userId);
    });
}

function createMessageElement(message) {
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isOwn = message.senderId === currentUser.id;

    return `
        <div class="message ${isOwn ? 'own' : 'other'}">
            <div class="message-content">
                <p>${message.content}</p>
                <span class="message-time">${getTimeAgo(message.createdAt)}</span>
            </div>
        </div>
    `;
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (!content || !currentUserId) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                receiverId: currentUserId,
                content
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const message = await response.json();
        
        // Add message to chat
        const messagesContainer = document.getElementById('chat-messages');
        const messageEl = createMessageElement(message);
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Clear input
        input.value = '';

        // Stop typing
        if (socket) {
            socket.emit('stop-typing', currentUserId);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message', 'error');
    }
}

function sendGift(userId) {
    const giftName = prompt('Enter gift name:');
    if (!giftName) return;

    const cost = prompt('Enter cost in credits:');
    if (!cost) return;

    const message = prompt('Add a message (optional):');

    const token = localStorage.getItem('token');

    fetch('/api/gifts', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            receiverId: userId,
            giftType: 'virtual',
            giftName,
            cost: parseInt(cost),
            message
        })
    })
    .then(response => response.json())
    .then(data => {
        showNotification('Gift sent successfully!', 'success');
    })
    .catch(error => {
        console.error('Error sending gift:', error);
        showNotification('Failed to send gift', 'error');
    });
}

function setupEventListeners() {
    document.getElementById('logout-btn').addEventListener('click', logout);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

function initSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('new-message', (message) => {
        if (currentUserId && message.senderId === currentUserId) {
            // Add message to current chat
            const messagesContainer = document.getElementById('chat-messages');
            const messageEl = createMessageElement(message);
            messagesContainer.appendChild(messageEl);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            // Show notification
            showNotification('New message received!', 'success');
            loadConversations();
        }
    });

    socket.on('user-typing', (userId) => {
        if (currentUserId === userId) {
            const chatHeader = document.querySelector('.chat-header');
            const existingIndicator = chatHeader.querySelector('.typing-indicator');
            if (!existingIndicator) {
                const indicator = document.createElement('span');
                indicator.className = 'typing-indicator';
                indicator.textContent = 'Typing...';
                chatHeader.appendChild(indicator);
            }
        }
    });

    socket.on('user-stopped-typing', (userId) => {
        if (currentUserId === userId) {
            const indicator = document.querySelector('.typing-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
    });

    socket.on('new-gift', (gift) => {
        showNotification(`You received a ${gift.giftName}!`, 'success');
    });
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
