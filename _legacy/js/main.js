// CamConnect - Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI components
    initNavigation();
    initAuthModals();
    initVideoChat();
    initScrollEffects();
});

// Navigation
function initNavigation() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Auth Modals
function initAuthModals() {
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const authModal = document.getElementById('auth-modal');
    const closeModal = document.querySelector('.close-modal');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            showAuthModal('login');
        });
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            showAuthModal('signup');
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            authModal.classList.remove('active');
        });
    }
    
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                authModal.classList.remove('active');
            }
        });
    }
}

function showAuthModal(type) {
    const authModal = document.getElementById('auth-modal');
    if (!authModal) return;
    
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (type === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
    
    authModal.classList.add('active');
}

// Video Chat
function initVideoChat() {
    const startBtn = document.getElementById('start-chat');
    const startBtn2 = document.getElementById('start-chat-2');
    
    if (startBtn) {
        startBtn.addEventListener('click', startVideoChat);
    }
    
    if (startBtn2) {
        startBtn2.addEventListener('click', startVideoChat);
    }
}

function startVideoChat() {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    if (!token) {
        showAuthModal('signup');
        return;
    }
    
    // Initialize video chat
    if (window.videoChat) {
        window.videoChat.init();
    }
    
    // Switch to video view
    showVideoInterface();
}

function showVideoInterface() {
    const hero = document.querySelector('.hero');
    const videoContainer = document.querySelector('.video-container');
    
    if (hero) hero.style.display = 'none';
    if (videoContainer) videoContainer.style.display = 'grid';
}

// Scroll Effects
function initScrollEffects() {
    const header = document.querySelector('header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card, .step').forEach(el => {
        observer.observe(el);
    });
}

// Form Handling
function handleFormSubmit(form, endpoint) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                if (result.token) {
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                }
                
                // Close modal
                document.getElementById('auth-modal').classList.remove('active');
                
                // Show success message
                showNotification('Success!', 'success');
                
                // Update UI
                updateAuthUI();
            } else {
                showNotification(result.error || 'An error occurred', 'error');
            }
        } catch (error) {
            showNotification('Network error. Please try again.', 'error');
        }
    });
}

function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    if (user) {
        loginBtn.textContent = user.username;
        loginBtn.onclick = () => logout();
        signupBtn.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.reload();
}

// Notifications
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

// Video Controls
function initVideoControls() {
    const videoBtn = document.getElementById('toggle-video');
    const audioBtn = document.getElementById('toggle-audio');
    const nextBtn = document.getElementById('next-partner');
    
    if (videoBtn) {
        videoBtn.addEventListener('click', () => {
            if (window.videoChat) {
                const enabled = window.videoChat.toggleVideo();
                videoBtn.classList.toggle('active', enabled);
            }
        });
    }
    
    if (audioBtn) {
        audioBtn.addEventListener('click', () => {
            if (window.videoChat) {
                const enabled = window.videoChat.toggleAudio();
                audioBtn.classList.toggle('active', enabled);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (window.videoChat) {
                window.videoChat.nextPartner();
            }
        });
    }
}

// Export functions
window.CamConnect = {
    showAuthModal,
    showNotification,
    logout
};
