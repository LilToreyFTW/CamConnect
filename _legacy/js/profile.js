// CamConnect - Profile Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    setupEventListeners();
    initSocket();
});

let currentUser = null;
let socket = null;

async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        currentUser = await response.json();
        updateUI(currentUser);
    } catch (error) {
        console.error('Error loading profile:', error);
        window.location.href = '../index.html';
    }
}

function updateUI(user) {
    document.getElementById('username').textContent = user.username;
    document.getElementById('user-bio').textContent = user.bio || 'No bio yet';
    document.getElementById('followers-count').textContent = user.followers || 0;
    document.getElementById('following-count').textContent = user.following || 0;
    document.getElementById('credits-count').textContent = user.credits || 0;

    // Set profile photo
    const profilePhoto = document.getElementById('profile-photo');
    const profilePic = user.photos?.find(p => p.isProfile);
    if (profilePic) {
        profilePhoto.src = profilePic.url;
    } else if (user.photos && user.photos.length > 0) {
        profilePhoto.src = user.photos[0].url;
    } else {
        profilePhoto.src = '/images/default-avatar.png';
    }

    // Set form values
    document.getElementById('bio').value = user.bio || '';
    document.getElementById('age').value = user.age || '';
    document.getElementById('gender').value = user.gender || '';
    document.getElementById('location').value = user.location?.city || '';

    // Load photos
    loadPhotos(user.photos);

    // Update online status
    updateOnlineStatus(user.isOnline);
}

function loadPhotos(photos) {
    const photosGrid = document.getElementById('photos-grid');
    photosGrid.innerHTML = '';

    if (!photos || photos.length === 0) {
        photosGrid.innerHTML = '<p>No photos yet</p>';
        return;
    }

    photos.forEach(photo => {
        const photoEl = document.createElement('div');
        photoEl.className = 'photo-item';
        photoEl.innerHTML = `
            <img src="${photo.url}" alt="Photo">
            ${photo.isProfile ? '<span class="profile-badge">Profile</span>' : ''}
            <button class="delete-photo" data-photo-id="${photo._id}">Delete</button>
        `;
        photosGrid.appendChild(photoEl);
    });

    // Add delete handlers
    document.querySelectorAll('.delete-photo').forEach(btn => {
        btn.addEventListener('click', deletePhoto);
    });
}

function setupEventListeners() {
    // Profile form
    document.getElementById('profile-form').addEventListener('submit', saveProfile);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Upload photo
    document.getElementById('upload-photo').addEventListener('click', uploadPhoto);
    document.getElementById('add-photo-btn').addEventListener('click', uploadPhoto);

    // Buy credits
    document.getElementById('buy-credits').addEventListener('click', buyCredits);

    // Find nearby users
    document.getElementById('nearby-users').addEventListener('click', findNearbyUsers);
}

async function saveProfile(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const bio = document.getElementById('bio').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const location = document.getElementById('location').value;

    try {
        const response = await fetch('/api/profile', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bio,
                age: age ? parseInt(age) : null,
                gender,
                location: location ? { city: location } : null
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save profile');
        }

        showNotification('Profile saved successfully!', 'success');
        loadProfile();
    } catch (error) {
        console.error('Error saving profile:', error);
        showNotification('Failed to save profile', 'error');
    }
}

async function uploadPhoto() {
    const url = prompt('Enter photo URL:');
    if (!url) return;

    const token = localStorage.getItem('token');
    const isProfile = confirm('Set as profile photo?');

    try {
        const response = await fetch('/api/profile/photos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, isProfile })
        });

        if (!response.ok) {
            throw new Error('Failed to upload photo');
        }

        showNotification('Photo uploaded successfully!', 'success');
        loadProfile();
    } catch (error) {
        console.error('Error uploading photo:', error);
        showNotification('Failed to upload photo', 'error');
    }
}

async function deletePhoto(e) {
    const photoId = e.target.dataset.photoId;
    if (!confirm('Delete this photo?')) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/profile/photos/${photoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete photo');
        }

        showNotification('Photo deleted successfully!', 'success');
        loadProfile();
    } catch (error) {
        console.error('Error deleting photo:', error);
        showNotification('Failed to delete photo', 'error');
    }
}

async function buyCredits() {
    const amount = prompt('Enter amount of credits to purchase:');
    if (!amount) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/credits/purchase', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: parseInt(amount) })
        });

        if (!response.ok) {
            throw new Error('Failed to purchase credits');
        }

        showNotification('Credits purchased successfully!', 'success');
        loadProfile();
    } catch (error) {
        console.error('Error purchasing credits:', error);
        showNotification('Failed to purchase credits', 'error');
    }
}

async function findNearbyUsers() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/users/nearby?maxDistance=50000', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to find nearby users');
        }

        const users = await response.json();
        alert(`Found ${users.length} nearby users!`);
    } catch (error) {
        console.error('Error finding nearby users:', error);
        showNotification('Failed to find nearby users. Please set your location first.', 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

function updateOnlineStatus(isOnline) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    if (isOnline) {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'Online';
    } else {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Offline';
    }
}

function initSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
        if (currentUser) {
            socket.emit('join', currentUser.id);
        }
    });

    socket.on('new-message', (message) => {
        showNotification('New message received!', 'success');
    });

    socket.on('new-gift', (gift) => {
        showNotification(`You received a ${gift.giftName}!`, 'success');
    });
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
