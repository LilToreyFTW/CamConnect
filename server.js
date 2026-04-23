const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', process.env.CLIENT_URL].filter(Boolean),
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/camconnect', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isPremium: { type: Boolean, default: false },
    gender: { type: String, enum: ['male', 'female', 'couple', 'other'], default: null },
    age: { type: Number, min: 18 },
    bio: { type: String, maxlength: 500 },
    location: {
        type: { type: String },
        coordinates: [Number],
        city: String,
        country: String
    },
    photos: [{
        url: String,
        isProfile: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    credits: { type: Number, default: 0 },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);

// Session Schema for active video chats
const sessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    isReported: { type: Boolean, default: false }
});

const Session = mongoose.model('Session', sessionSchema);

// Report Schema
const reportSchema = new mongoose.Schema({
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Post/Activity Schema
const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, maxlength: 500 },
    photos: [String],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Virtual Gift Schema
const giftSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    giftType: { type: String, required: true },
    giftName: { type: String, required: true },
    cost: { type: Number, required: true },
    message: String,
    createdAt: { type: Date, default: Date.now }
});

const Gift = mongoose.model('Gift', giftSchema);

// Credit Transaction Schema
const creditTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['purchase', 'gift', 'premium', 'refund'], required: true },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);

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
        const user = await User.findById(decoded.userId);
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
        const { username, email, password, gender } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            gender
        });
        
        await user.save();
        
        // Generate token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isPremium: user.isPremium,
                gender: user.gender
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
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        user.lastLogin = Date.now();
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isPremium: user.isPremium,
                gender: user.gender
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    res.json({
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        isPremium: req.user.isPremium,
        gender: req.user.gender,
        age: req.user.age,
        bio: req.user.bio,
        location: req.user.location,
        photos: req.user.photos,
        credits: req.user.credits,
        followers: req.user.followers.length,
        following: req.user.following.length,
        isOnline: req.user.isOnline
    });
});

// Update profile
app.patch('/api/profile', authMiddleware, async (req, res) => {
    try {
        const { bio, age, gender, location } = req.body;
        
        const updates = {};
        if (bio !== undefined) updates.bio = bio;
        if (age !== undefined) updates.age = age;
        if (gender !== undefined) updates.gender = gender;
        if (location !== undefined) updates.location = location;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true }
        );
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload photo
app.post('/api/profile/photos', authMiddleware, async (req, res) => {
    try {
        const { url, isProfile } = req.body;
        
        const user = await User.findById(req.user._id);
        
        if (isProfile) {
            user.photos.forEach(photo => photo.isProfile = false);
        }
        
        user.photos.push({ url, isProfile: isProfile || false });
        await user.save();
        
        res.json(user.photos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete photo
app.delete('/api/profile/photos/:photoId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.photos = user.photos.filter(photo => photo._id.toString() !== req.params.photoId);
        await user.save();
        
        res.json(user.photos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password -email');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Find users nearby (location-based)
app.get('/api/users/nearby', authMiddleware, async (req, res) => {
    try {
        const { maxDistance = 50000 } = req.query; // 50km default
        
        if (!req.user.location || !req.user.location.coordinates) {
            return res.status(400).json({ error: 'Location not set' });
        }
        
        const nearbyUsers = await User.find({
            _id: { $ne: req.user._id },
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: req.user.location.coordinates
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            }
        }).select('-password -email');
        
        res.json(nearbyUsers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Follow user
app.post('/api/follow/:userId', authMiddleware, async (req, res) => {
    try {
        if (req.user._id.toString() === req.params.userId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }
        
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const currentUser = await User.findById(req.user._id);
        
        if (currentUser.following.includes(req.params.userId)) {
            return res.status(400).json({ error: 'Already following' });
        }
        
        currentUser.following.push(req.params.userId);
        targetUser.followers.push(req.user._id);
        
        await currentUser.save();
        await targetUser.save();
        
        res.json({ message: 'Followed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Unfollow user
app.delete('/api/follow/:userId', authMiddleware, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);
        const targetUser = await User.findById(req.params.userId);
        
        currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.userId);
        targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.user._id.toString());
        
        await currentUser.save();
        await targetUser.save();
        
        res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get followers
app.get('/api/profile/:userId/followers', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('followers', 'username photos isOnline');
        
        res.json(user.followers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get following
app.get('/api/profile/:userId/following', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('following', 'username photos isOnline');
        
        res.json(user.following);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send message
app.post('/api/messages', authMiddleware, async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        
        const message = new Message({
            senderId: req.user._id,
            receiverId,
            content
        });
        
        await message.save();
        
        // Emit to receiver if online
        io.to(receiverId.toString()).emit('new-message', message);
        
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get conversation
app.get('/api/messages/:userId', authMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { senderId: req.user._id, receiverId: req.params.userId },
                { senderId: req.params.userId, receiverId: req.user._id }
            ]
        }).sort({ createdAt: 1 });
        
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get conversations list
app.get('/api/conversations', authMiddleware, async (req, res) => {
    try {
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: req.user._id },
                        { receiverId: req.user._id }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$senderId', req.user._id] },
                            '$receiverId',
                            '$senderId'
                        ]
                    },
                    lastMessage: { $first: '$content' },
                    lastMessageTime: { $first: '$createdAt' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$receiverId', req.user._id] }, { $eq: ['$isRead', false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    userId: '$_id',
                    username: '$user.username',
                    photos: '$user.photos',
                    isOnline: '$user.isOnline',
                    lastMessage: 1,
                    lastMessageTime: 1,
                    unreadCount: 1
                }
            }
        ]);
        
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark messages as read
app.patch('/api/messages/:userId/read', authMiddleware, async (req, res) => {
    try {
        await Message.updateMany(
            {
                senderId: req.params.userId,
                receiverId: req.user._id,
                isRead: false
            },
            { isRead: true }
        );
        
        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create post
app.post('/api/posts', authMiddleware, async (req, res) => {
    try {
        const { content, photos } = req.body;
        
        const post = new Post({
            userId: req.user._id,
            content,
            photos: photos || []
        });
        
        await post.save();
        
        // Populate user data
        await post.populate('userId', 'username photos');
        
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get feed
app.get('/api/feed', authMiddleware, async (req, res) => {
    try {
        const { limit = 20, skip = 0 } = req.query;
        
        const posts = await Post.find()
            .populate('userId', 'username photos isOnline')
            .populate('likes', 'username photos')
            .populate('comments.userId', 'username photos')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));
        
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Like post
app.post('/api/posts/:postId/like', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        if (post.likes.includes(req.user._id)) {
            post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
        }
        
        await post.save();
        
        res.json({ liked: post.likes.includes(req.user._id), count: post.likes.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Comment on post
app.post('/api/posts/:postId/comments', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        post.comments.push({
            userId: req.user._id,
            content
        });
        
        await post.save();
        
        res.json(post.comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Purchase credits
app.post('/api/credits/purchase', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        
        const user = await User.findById(req.user._id);
        user.credits += amount;
        await user.save();
        
        const transaction = new CreditTransaction({
            userId: req.user._id,
            amount,
            type: 'purchase',
            description: `Purchased ${amount} credits`
        });
        
        await transaction.save();
        
        res.json({ credits: user.credits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get credit balance
app.get('/api/credits', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ credits: user.credits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send virtual gift
app.post('/api/gifts', authMiddleware, async (req, res) => {
    try {
        const { receiverId, giftType, giftName, cost, message } = req.body;
        
        const sender = await User.findById(req.user._id);
        
        if (sender.credits < cost) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }
        
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Deduct credits
        sender.credits -= cost;
        await sender.save();
        
        // Create gift record
        const gift = new Gift({
            senderId: req.user._id,
            receiverId,
            giftType,
            giftName,
            cost,
            message
        });
        
        await gift.save();
        
        // Record transaction
        const transaction = new CreditTransaction({
            userId: req.user._id,
            amount: -cost,
            type: 'gift',
            description: `Sent ${giftName} to ${receiver.username}`
        });
        
        await transaction.save();
        
        // Notify receiver
        io.to(receiverId.toString()).emit('new-gift', gift);
        
        res.json({ credits: sender.credits, gift });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get received gifts
app.get('/api/gifts/received', authMiddleware, async (req, res) => {
    try {
        const gifts = await Gift.find({ receiverId: req.user._id })
            .populate('senderId', 'username photos')
            .sort({ createdAt: -1 });
        
        res.json(gifts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sent gifts
app.get('/api/gifts/sent', authMiddleware, async (req, res) => {
    try {
        const gifts = await Gift.find({ senderId: req.user._id })
            .populate('receiverId', 'username photos')
            .sort({ createdAt: -1 });
        
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
                    unit_amount: 999, // $9.99
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
            customer_email: req.user.email,
            metadata: {
                userId: req.user._id.toString()
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
        const userId = session.metadata.userId;
        
        await User.findByIdAndUpdate(userId, { isPremium: true });
    }
    
    res.json({ received: true });
});

// Report user
app.post('/api/report', authMiddleware, async (req, res) => {
    try {
        const { reportedId, reason, description } = req.body;
        
        const report = new Report({
            reporterId: req.user._id,
            reportedId,
            reason,
            description
        });
        
        await report.save();
        
        res.status(201).json({ message: 'Report submitted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin - Get all reports
app.get('/api/admin/reports', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporterId', 'username email')
            .populate('reportedId', 'username email')
            .sort({ createdAt: -1 });
        
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin - Update report status
app.patch('/api/admin/reports/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        
        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin - Get all users
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin - Ban user
app.patch('/api/admin/users/:id/ban', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isBanned: true },
            { new: true }
        );
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// WebRTC Signaling & Real-time Features
const activeUsers = new Map();
const userSockets = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join', async (userId) => {
        activeUsers.set(socket.id, userId);
        userSockets.set(userId, socket.id);
        socket.userId = userId;
        
        // Update online status
        try {
            await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: Date.now() });
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    });
    
    socket.on('find-partner', (data) => {
        const { gender, isPremium } = data;
        
        // Find available user
        for (const [socketId, userId] of activeUsers) {
            if (socketId !== socket.id) {
                const otherSocket = io.sockets.sockets.get(socketId);
                if (otherSocket && !otherSocket.partnerId) {
                    // Match found
                    socket.partnerId = socketId;
                    otherSocket.partnerId = socket.id;
                    
                    socket.emit('partner-found', { socketId, userId });
                    otherSocket.emit('partner-found', { socketId: socket.id, userId: socket.userId });
                    
                    return;
                }
            }
        }
        
        // No partner found
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
            const message = new Message({
                senderId: socket.userId,
                receiverId,
                content
            });
            
            await message.save();
            
            // Send to receiver if online
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
        
        // Update offline status
        if (socket.userId) {
            try {
                await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: Date.now() });
                userSockets.delete(socket.userId);
            } catch (error) {
                console.error('Error updating offline status:', error);
            }
        }
        
        activeUsers.delete(socket.id);
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
