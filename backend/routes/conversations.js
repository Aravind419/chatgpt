import express from 'express';
import Conversation from '../models/Conversation.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('-messages'); // Don't send messages in list view for performance

    // Transform to match frontend format
    const conversationsMap = {};
    conversations.forEach(conv => {
      conversationsMap[conv._id.toString()] = {
        id: conv._id.toString(),
        title: conv.title,
        messages: conv.messages || [],
        createdAt: conv.createdAt,
        model: conv.model
      };
    });

    res.json({
      success: true,
      conversations: conversationsMap
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/conversations/:id
// @desc    Get single conversation with messages
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        title: conversation.title,
        messages: conversation.messages || [],
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        model: conversation.model
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/conversations
// @desc    Create new conversation
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { model } = req.body;

    const conversation = await Conversation.create({
      userId: req.user._id,
      title: 'New Chat',
      messages: [],
      model: model || 'gpt-5'
    });

    res.status(201).json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        title: conversation.title,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        model: conversation.model
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/conversations/:id
// @desc    Update conversation (title, model)
// @access  Private
router.patch('/:id', async (req, res) => {
  try {
    const { title, model } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      {
        ...(title && { title }),
        ...(model && { model }),
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        title: conversation.title,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        model: conversation.model
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/conversations/:id
// @desc    Delete conversation
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/conversations/:id/messages
// @desc    Add message to conversation
// @access  Private
router.post('/:id/messages', async (req, res) => {
  try {
    const { sender, content, images } = req.body;

    if (!sender || !content) {
      return res.status(400).json({ message: 'Sender and content are required' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const newMessage = {
      sender,
      content,
      images: images || [],
      timestamp: new Date()
    };

    conversation.messages.push(newMessage);
    await conversation.save();

    res.json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/conversations/:id/messages
// @desc    Clear all messages from conversation
// @access  Private
router.delete('/:id/messages', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.messages = [];
    await conversation.save();

    res.json({
      success: true,
      message: 'Messages cleared successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

