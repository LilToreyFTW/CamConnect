// CamConnect - Feed Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    loadFeed();
    loadNearbyUsers();
    setupEventListeners();
    initSocket();
});

let socket = null;
let skip = 0;
const limit = 20;

async function loadFeed() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch(`/api/feed?limit=${limit}&skip=${skip}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load feed');
        }

        const posts = await response.json();
        renderPosts(posts);
    } catch (error) {
        console.error('Error loading feed:', error);
    }
}

function renderPosts(posts) {
    const feedPosts = document.getElementById('feed-posts');
    
    if (posts.length === 0) {
        feedPosts.innerHTML = '<p class="no-posts">No posts yet. Be the first to post!</p>';
        return;
    }

    posts.forEach(post => {
        const postEl = createPostElement(post);
        feedPosts.appendChild(postEl);
    });
}

function createPostElement(post) {
    const postEl = document.createElement('div');
    postEl.className = 'post';
    postEl.dataset.postId = post._id;

    const user = post.userId;
    const profilePic = user.photos?.find(p => p.isProfile) || user.photos?.[0];
    const timeAgo = getTimeAgo(post.createdAt);

    postEl.innerHTML = `
        <div class="post-header">
            <img src="${profilePic?.url || '/images/default-avatar.png'}" alt="${user.username}" class="post-avatar">
            <div class="post-user">
                <h3>${user.username}</h3>
                <span class="post-time">${timeAgo}</span>
            </div>
            <span class="post-status ${user.isOnline ? 'online' : 'offline'}"></span>
        </div>
        <div class="post-content">
            <p>${post.content}</p>
            ${post.photos && post.photos.length > 0 ? `
                <div class="post-photos">
                    ${post.photos.map(photo => `<img src="${photo}" alt="Post photo">`).join('')}
                </div>
            ` : ''}
        </div>
        <div class="post-actions">
            <button class="post-action like-btn" data-post-id="${post._id}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span class="like-count">${post.likes.length}</span>
            </button>
            <button class="post-action comment-btn" data-post-id="${post._id}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <span class="comment-count">${post.comments.length}</span>
            </button>
        </div>
        <div class="post-comments" id="comments-${post._id}">
            ${post.comments.slice(-3).map(comment => `
                <div class="comment">
                    <strong>${comment.userId.username}:</strong>
                    <span>${comment.content}</span>
                </div>
            `).join('')}
        </div>
        <div class="comment-form">
            <input type="text" class="comment-input" placeholder="Write a comment..." data-post-id="${post._id}">
        </div>
    `;

    // Add event listeners
    postEl.querySelector('.like-btn').addEventListener('click', () => likePost(post._id));
    postEl.querySelector('.comment-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addComment(post._id, e.target.value);
        }
    });

    return postEl;
}

async function loadNearbyUsers() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/users/nearby?maxDistance=50000', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load nearby users');
        }

        const users = await response.json();
        renderNearbyUsers(users);
    } catch (error) {
        console.error('Error loading nearby users:', error);
        document.getElementById('nearby-list').innerHTML = '<p>Enable location to see nearby users</p>';
    }
}

function renderNearbyUsers(users) {
    const nearbyList = document.getElementById('nearby-list');
    
    if (users.length === 0) {
        nearbyList.innerHTML = '<p>No nearby users found</p>';
        return;
    }

    nearbyList.innerHTML = users.slice(0, 5).map(user => {
        const profilePic = user.photos?.find(p => p.isProfile) || user.photos?.[0];
        return `
            <div class="nearby-user">
                <img src="${profilePic?.url || '/images/default-avatar.png'}" alt="${user.username}">
                <div class="nearby-info">
                    <span class="nearby-name">${user.username}</span>
                    <span class="nearby-status ${user.isOnline ? 'online' : 'offline'}">${user.isOnline ? 'Online' : 'Offline'}</span>
                </div>
            </div>
        `;
    }).join('');
}

function setupEventListeners() {
    // Post form
    document.getElementById('post-form').addEventListener('submit', createPost);

    // Load more
    document.getElementById('load-more').addEventListener('click', () => {
        skip += limit;
        loadFeed();
    });

    // Refresh nearby
    document.getElementById('refresh-nearby').addEventListener('click', loadNearbyUsers);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);
}

async function createPost(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const content = document.getElementById('post-content').value;
    const photos = document.getElementById('post-photos').value.split(',').map(url => url.trim()).filter(url => url);

    if (!content.trim()) {
        showNotification('Please enter some content', 'error');
        return;
    }

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content, photos })
        });

        if (!response.ok) {
            throw new Error('Failed to create post');
        }

        const post = await response.json();
        
        // Add to top of feed
        const feedPosts = document.getElementById('feed-posts');
        const postEl = createPostElement(post);
        feedPosts.insertBefore(postEl, feedPosts.firstChild);

        // Clear form
        document.getElementById('post-content').value = '';
        document.getElementById('post-photos').value = '';

        showNotification('Post created successfully!', 'success');
    } catch (error) {
        console.error('Error creating post:', error);
        showNotification('Failed to create post', 'error');
    }
}

async function likePost(postId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to like post');
        }

        const result = await response.json();
        
        // Update UI
        const postEl = document.querySelector(`[data-post-id="${postId}"]`);
        const likeBtn = postEl.querySelector('.like-btn');
        const likeCount = postEl.querySelector('.like-count');
        
        likeCount.textContent = result.count;
        likeBtn.classList.toggle('liked', result.liked);
    } catch (error) {
        console.error('Error liking post:', error);
    }
}

async function addComment(postId, content) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            throw new Error('Failed to add comment');
        }

        const comments = await response.json();
        
        // Update UI
        const commentsContainer = document.getElementById(`comments-${postId}`);
        const lastComment = comments[comments.length - 1];
        
        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.innerHTML = `
            <strong>${lastComment.userId.username}:</strong>
            <span>${lastComment.content}</span>
        `;
        commentsContainer.appendChild(commentEl);

        // Update comment count
        const postEl = document.querySelector(`[data-post-id="${postId}"]`);
        const commentCount = postEl.querySelector('.comment-count');
        commentCount.textContent = comments.length;

        // Clear input
        document.querySelector(`.comment-input[data-post-id="${postId}"]`).value = '';
    } catch (error) {
        console.error('Error adding comment:', error);
    }
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

    socket.on('new-post', (post) => {
        const feedPosts = document.getElementById('feed-posts');
        const postEl = createPostElement(post);
        feedPosts.insertBefore(postEl, feedPosts.firstChild);
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
