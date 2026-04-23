const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const prisma = new PrismaClient();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', process.env.CLIENT_URL].filter(Boolean),
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth Middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Admin Middleware
const adminMiddleware = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, gender, adminPassword } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Admin creation check
        const isAdmin = adminPassword && adminPassword === process.env.ADMIN_PASSWORD;

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                gender,
                isAdmin
            }
        });

        // Generate token
        const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isPremium: user.isPremium,
                gender: user.gender,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isPremium: user.isPremium,
                gender: user.gender,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    const photos = await prisma.photo.findMany({ where: { userId: req.user.id } });
    const followers = await prisma.follow.count({ where: { followingId: req.user.id } });
    const following = await prisma.follow.count({ where: { followerId: req.user.id } });

    res.json({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        isPremium: req.user.isPremium,
        isAdmin: req.user.isAdmin,
        gender: req.user.gender,
        age: req.user.age,
        bio: req.user.bio,
        photos,
        credits: req.user.credits,
        followers,
        following,
        isOnline: req.user.isOnline
    });
});

// Update profile
app.patch('/api/profile', authMiddleware, async (req, res) => {
    try {
        const { bio, age, gender, location } = req.body;

        const data = {};
        if (bio !== undefined) data.bio = bio;
        if (age !== undefined) data.age = age;
        if (gender !== undefined) data.gender = gender;
        if (location !== undefined) data.location = location;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload photo
app.post('/api/profile/photos', authMiddleware, async (req, res) => {
    try {
        const { url, isProfile } = req.body;

        if (isProfile) {
            await prisma.photo.updateMany({
                where: { userId: req.user.id },
                data: { isProfile: false }
            });
        }

        await prisma.photo.create({
            data: {
                userId: req.user.id,
                url,
                isProfile: isProfile || false
            }
        });

        const photos = await prisma.photo.findMany({ where: { userId: req.user.id } });
        res.json(photos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete photo
app.delete('/api/profile/photos/:photoId', authMiddleware, async (req, res) => {
    try {
        await prisma.photo.delete({
            where: { id: parseInt(req.params.photoId) }
        });

        const photos = await prisma.photo.findMany({ where: { userId: req.user.id } });
        res.json(photos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/profile/:userId', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.params.userId) },
            select: {
                id: true,
                username: true,
                gender: true,
                age: true,
                bio: true,
                isPremium: true,
                isOnline: true,
                lastSeen: true,
                createdAt: true,
                photos: true,
                credits: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Find users nearby (simplified - returns all users except self)
app.get('/api/users/nearby', authMiddleware, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { id: { not: req.user.id } },
            select: {
                id: true,
                username: true,
                gender: true,
                age: true,
                bio: true,
                isOnline: true,
                photos: true
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Follow user
app.post('/api/follow/:userId', authMiddleware, async (req, res) => {
    try {
        const targetId = parseInt(req.params.userId);
        if (req.user.id === targetId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const existing = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: req.user.id, followingId: targetId } }
        });
        if (existing) {
            return res.status(400).json({ error: 'Already following' });
        }

        await prisma.follow.create({
            data: { followerId: req.user.id, followingId: targetId }
        });

        res.json({ message: 'Followed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Unfollow user
app.delete('/api/follow/:userId', authMiddleware, async (req, res) => {
    try {
        const targetId = parseInt(req.params.userId);
        await prisma.follow.delete({
            where: { followerId_followingId: { followerId: req.user.id, followingId: targetId } }
        });

        res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get followers
app.get('/api/profile/:userId/followers', async (req, res) => {
    try {
        const followers = await prisma.follow.findMany({
            where: { followingId: parseInt(req.params.userId) },
            include: {
                follower: {
                    select: { id: true, username: true, isOnline: true, photos: true }
                }
            }
        });
        res.json(followers.map(f => f.follower));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get following
app.get('/api/profile/:userId/following', async (req, res) => {
    try {
        const following = await prisma.follow.findMany({
            where: { followerId: parseInt(req.params.userId) },
            include: {
                following: {
                    select: { id: true, username: true, isOnline: true, photos: true }
                }
            }
        });
        res.json(following.map(f => f.following));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send message
app.post('/api/messages', authMiddleware, async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        const message = await prisma.message.create({
            data: {
                senderId: req.user.id,
                receiverId: parseInt(receiverId),
                content
            }
        });

        io.to(receiverId.toString()).emit('new-message', message);

        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get conversation
app.get('/api/messages/:userId', authMiddleware, async (req, res) => {
    try {
        const otherId = parseInt(req.params.userId);
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: req.user.id, receiverId: otherId },
                    { senderId: otherId, receiverId: req.user.id }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get conversations list
app.get('/api/conversations', authMiddleware, async (req, res) => {
    try {
        const result = await prisma.$queryRaw`
            SELECT
                other_id as "userId",
                u.username,
                u."isOnline",
                last_message as "lastMessage",
                last_message_time as "lastMessageTime",
                unread_count as "unreadCount"
            FROM (
                SELECT
                    CASE
                        WHEN sender_id = ${req.user.id} THEN receiver_id
                        ELSE sender_id
                    END as other_id,
                    MAX(content) FILTER (WHERE created_at = max_created_at) as last_message,
                    max_created_at as last_message_time,
                    COUNT(*) FILTER (WHERE receiver_id = ${req.user.id} AND is_read = false)::int as unread_count
                FROM (
                    SELECT *, MAX(created_at) OVER (PARTITION BY CASE WHEN sender_id = ${req.user.id} THEN receiver_id ELSE sender_id END) as max_created_at
                    FROM "Message"
                    WHERE sender_id = ${req.user.id} OR receiver_id = ${req.user.id}
                ) sub
                GROUP BY other_id, max_created_at
            ) conv
            JOIN "User" u ON u.id = conv.other_id
            ORDER BY last_message_time DESC
        `;
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark messages as read
app.patch('/api/messages/:userId/read', authMiddleware, async (req, res) => {
    try {
        await prisma.message.updateMany({
            where: {
                senderId: parseInt(req.params.userId),
                receiverId: req.user.id,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create post
app.post('/api/posts', authMiddleware, async (req, res) => {
    try {
        const { content, photos = [] } = req.body;

        const post = await prisma.post.create({
            data: {
                userId: req.user.id,
                content,
                photos: {
                    create: photos.map(url => ({ url }))
                }
            },
            include: {
                user: { select: { id: true, username: true, photos: true } },
                photos: true,
                likes: true,
                comments: { include: { user: { select: { id: true, username: true, photos: true } } } }
            }
        });

        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get feed
app.get('/api/feed', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const skip = parseInt(req.query.skip) || 0;

        const posts = await prisma.post.findMany({
            include: {
                user: { select: { id: true, username: true, photos: true, isOnline: true } },
                photos: true,
                likes: { include: { user: { select: { id: true, username: true, photos: true } } } },
                comments: { include: { user: { select: { id: true, username: true, photos: true } } } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip
        });

        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Like post
app.post('/api/posts/:postId/like', authMiddleware, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);

        const existing = await prisma.postLike.findUnique({
            where: { postId_userId: { postId, userId: req.user.id } }
        });

        if (existing) {
            await prisma.postLike.delete({
                where: { postId_userId: { postId, userId: req.user.id } }
            });
        } else {
            await prisma.postLike.create({
                data: { postId, userId: req.user.id }
            });
        }

        const count = await prisma.postLike.count({ where: { postId } });
        res.json({ liked: !existing, count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Comment on post
app.post('/api/posts/:postId/comments', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        const postId = parseInt(req.params.postId);

        await prisma.postComment.create({
            data: { postId, userId: req.user.id, content }
        });

        const comments = await prisma.postComment.findMany({
            where: { postId },
            include: { user: { select: { id: true, username: true, photos: true } } },
            orderBy: { createdAt: 'asc' }
        });

        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Purchase credits
app.post('/api/credits/purchase', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { credits: { increment: amount } }
        });

        await prisma.creditTransaction.create({
            data: {
                userId: req.user.id,
                amount,
                type: 'purchase',
                description: `Purchased ${amount} credits`
            }
        });

        res.json({ credits: user.credits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get credit balance
app.get('/api/credits', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { credits: true }
        });
        res.json({ credits: user.credits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send virtual gift
app.post('/api/gifts', authMiddleware, async (req, res) => {
    try {
        const { receiverId, giftType, giftName, cost, message } = req.body;

        const sender = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (sender.credits < cost) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }

        const receiver = await prisma.user.findUnique({ where: { id: parseInt(receiverId) } });
        if (!receiver) {
            return res.status(404).json({ error: 'User not found' });
        }

        await prisma.user.update({
            where: { id: req.user.id },
            data: { credits: { decrement: cost } }
        });

        const gift = await prisma.gift.create({
            data: {
                senderId: req.user.id,
                receiverId: parseInt(receiverId),
                giftType,
                giftName,
                cost,
                message
            }
        });

        await prisma.creditTransaction.create({
            data: {
                userId: req.user.id,
                amount: -cost,
                type: 'gift',
                description: `Sent ${giftName} to ${receiver.username}`
            }
        });

        io.to(receiverId.toString()).emit('new-gift', gift);

        const updatedSender = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { credits: true }
        });

        res.json({ credits: updatedSender.credits, gift });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get received gifts
app.get('/api/gifts/received', authMiddleware, async (req, res) => {
    try {
        const gifts = await prisma.gift.findMany({
            where: { receiverId: req.user.id },
            include: { sender: { select: { id: true, username: true, photos: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(gifts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sent gifts
app.get('/api/gifts/sent', authMiddleware, async (req, res) => {
    try {
        const gifts = await prisma.gift.findMany({
            where: { senderId: req.user.id },
            include: { receiver: { select: { id: true, username: true, photos: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(gifts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Payment - Create checkout session
app.post('/api/payment/create-checkout-session', authMiddleware, async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Premium Membership',
                        description: 'Access to premium features',
                    },
                    unit_amount: 999,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
            customer_email: req.user.email,
            metadata: {
                userId: req.user.id.toString()
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Payment success webhook
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = parseInt(session.metadata.userId);

        await prisma.user.update({
            where: { id: userId },
            data: { isPremium: true }
        });
    }

    res.json({ received: true });
});

// Report user
app.post('/api/report', authMiddleware, async (req, res) => {
    try {
        const { reportedId, reason, description } = req.body;

        await prisma.report.create({
            data: {
                reporterId: req.user.id,
                reportedId: parseInt(reportedId),
                reason,
                description
            }
        });

        res.status(201).json({ message: 'Report submitted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin - Get all reports
app.get('/api/admin/reports', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            include: {
                reporter: { select: { id: true, username: true, email: true } },
                reported: { select: { id: true, username: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin - Update report status
app.patch('/api/admin/reports/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        const report = await prisma.report.update({
            where: { id: parseInt(req.params.id) },
            data: { status }
        });

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin - Get all users
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                isPremium: true,
                isAdmin: true,
                isBanned: true,
                gender: true,
                age: true,
                credits: true,
                isOnline: true,
                createdAt: true,
                lastLogin: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin - Ban user
app.patch('/api/admin/users/:id/ban', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: parseInt(req.params.id) },
            data: { isBanned: true }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// WebRTC Signaling & Real-time Features
const activeUsers = new Map();
const userSockets = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', async (userId) => {
        activeUsers.set(socket.id, userId);
        userSockets.set(userId, socket.id);
        socket.userId = userId;

        try {
            await prisma.user.update({
                where: { id: parseInt(userId) },
                data: { isOnline: true, lastSeen: new Date() }
            });
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    });

    socket.on('find-partner', (data) => {
        const { gender, isPremium } = data;

        for (const [socketId, userId] of activeUsers) {
            if (socketId !== socket.id) {
                const otherSocket = io.sockets.sockets.get(socketId);
                if (otherSocket && !otherSocket.partnerId) {
                    socket.partnerId = socketId;
                    otherSocket.partnerId = socket.id;

                    socket.emit('partner-found', { socketId, userId });
                    otherSocket.emit('partner-found', { socketId: socket.id, userId: socket.userId });

                    return;
                }
            }
        }

        socket.emit('no-partner');
    });

    socket.on('offer', (data) => {
        const { target, offer } = data;
        const targetSocket = io.sockets.sockets.get(target);
        if (targetSocket) {
            targetSocket.emit('offer', { offer, sender: socket.id });
        }
    });

    socket.on('answer', (data) => {
        const { target, answer } = data;
        const targetSocket = io.sockets.sockets.get(target);
        if (targetSocket) {
            targetSocket.emit('answer', { answer, sender: socket.id });
        }
    });

    socket.on('ice-candidate', (data) => {
        const { target, candidate } = data;
        const targetSocket = io.sockets.sockets.get(target);
        if (targetSocket) {
            targetSocket.emit('ice-candidate', { candidate, sender: socket.id });
        }
    });

    socket.on('next', () => {
        if (socket.partnerId) {
            const partnerSocket = io.sockets.sockets.get(socket.partnerId);
            if (partnerSocket) {
                partnerSocket.emit('partner-left');
                partnerSocket.partnerId = null;
            }
            socket.partnerId = null;
        }
        socket.emit('ready-for-next');
    });

    // Real-time messaging
    socket.on('send-message', async (data) => {
        const { receiverId, content } = data;

        try {
            const message = await prisma.message.create({
                data: {
                    senderId: parseInt(socket.userId),
                    receiverId: parseInt(receiverId),
                    content
                }
            });

            const receiverSocketId = userSockets.get(receiverId);
            if (receiverSocketId) {
                const receiverSocket = io.sockets.sockets.get(receiverSocketId);
                if (receiverSocket) {
                    receiverSocket.emit('new-message', message);
                }
            }

            socket.emit('message-sent', message);
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('message-error', { error: 'Failed to send message' });
        }
    });

    // Typing indicators
    socket.on('typing', (receiverId) => {
        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
            const receiverSocket = io.sockets.sockets.get(receiverSocketId);
            if (receiverSocket) {
                receiverSocket.emit('user-typing', socket.userId);
            }
        }
    });

    socket.on('stop-typing', (receiverId) => {
        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
            const receiverSocket = io.sockets.sockets.get(receiverSocketId);
            if (receiverSocket) {
                receiverSocket.emit('user-stopped-typing', socket.userId);
            }
        }
    });

    // Join user's personal room for notifications
    socket.on('join-room', (userId) => {
        socket.join(userId.toString());
    });

    socket.on('disconnect', async () => {
        if (socket.partnerId) {
            const partnerSocket = io.sockets.sockets.get(socket.partnerId);
            if (partnerSocket) {
                partnerSocket.emit('partner-left');
                partnerSocket.partnerId = null;
            }
        }

        if (socket.userId) {
            try {
                await prisma.user.update({
                    where: { id: parseInt(socket.userId) },
                    data: { isOnline: false, lastSeen: new Date() }
                });
                userSockets.delete(socket.userId);
            } catch (error) {
                console.error('Error updating offline status:', error);
            }
        }

        activeUsers.delete(socket.id);
        console.log('User disconnected:', socket.id);
    });
});

// Seed owner account on startup
async function seedOwner() {
    try {
        const existing = await prisma.user.findUnique({
            where: { email: 'gtagod2020torey@gmail.com' }
        });
        if (existing) {
            console.log('Owner account already exists');
            return;
        }
        const hashedPassword = await bcrypt.hash('Torey991200@##@@##$$Owner', 10);
        await prisma.user.create({
            data: {
                username: 'KingTorFTW',
                email: 'gtagod2020torey@gmail.com',
                password: hashedPassword,
                isAdmin: true,
                credits: 99999999999,
                gender: 'male',
                isOnline: false,
                lastSeen: new Date(),
                createdAt: new Date(),
                lastLogin: new Date()
            }
        });
        console.log('Owner account created: KingTorFTW');
    } catch (err) {
        console.error('Failed to seed owner account:', err.message);
    }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
    await seedOwner();
    console.log(`Server running on port ${PORT}`);
});
