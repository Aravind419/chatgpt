import express from 'express';
import Memory from '../models/Memory.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/memories
// @desc    Get all memories for current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { conversationId, type } = req.query;
    
    // Build query - if conversationId is 'null' or empty string, get all user memories
    const query = { userId: req.user._id };
    
    // Only filter by conversationId if it's explicitly provided and not null
    if (conversationId && conversationId !== 'null' && conversationId !== '') {
      query.conversationId = conversationId;
    } else if (conversationId === 'null' || conversationId === '') {
      // If explicitly null, get only global memories (no conversationId)
      query.conversationId = null;
    }
    // If conversationId is not provided at all, get ALL memories (both global and conversation-specific)
    
    if (type) {
      query.type = type;
    }

    const memories = await Memory.find(query)
      .sort({ updatedAt: -1 })
      .populate('conversationId', 'title');

    const formattedMemories = memories.map(m => ({
      id: m._id.toString(),
      content: m.content,
      type: m.type,
      tags: m.tags || [],
      importance: m.importance || 3,
      conversationId: m.conversationId ? m.conversationId._id.toString() : null,
      conversationTitle: m.conversationId ? m.conversationId.title : null,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    res.json({
      success: true,
      memories: formattedMemories
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/memories
// @desc    Create new memory
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { content, type, tags, importance, conversationId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Memory content is required' });
    }

    const memoryData = {
      userId: req.user._id,
      conversationId: conversationId || null,
      content: content.trim(),
      type: type || 'fact',
      tags: tags || [],
      importance: importance || 3
    };

    const memory = await Memory.create(memoryData);

    if (!memory || !memory._id) {
      throw new Error('Memory creation failed - no ID returned');
    }

    // Populate conversation title if conversationId exists
    if (memory.conversationId) {
      await memory.populate('conversationId', 'title');
    }

    const responseMemory = {
      id: memory._id.toString(),
      content: memory.content,
      type: memory.type,
      tags: memory.tags || [],
      importance: memory.importance || 3,
      conversationId: memory.conversationId ? memory.conversationId._id.toString() : null,
      conversationTitle: memory.conversationId ? memory.conversationId.title : null,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt
    };

    res.status(201).json({
      success: true,
      memory: responseMemory
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/memories/:id
// @desc    Update memory
// @access  Private
router.patch('/:id', async (req, res) => {
  try {
    const { content, type, tags, importance } = req.body;

    const memory = await Memory.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      {
        ...(content && { content: content.trim() }),
        ...(type && { type }),
        ...(tags !== undefined && { tags }),
        ...(importance !== undefined && { importance }),
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }

    res.json({
      success: true,
      memory: {
        id: memory._id.toString(),
        content: memory.content,
        type: memory.type,
        tags: memory.tags,
        importance: memory.importance,
        conversationId: memory.conversationId ? memory.conversationId.toString() : null,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/memories/:id
// @desc    Delete memory
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const memory = await Memory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }

    res.json({
      success: true,
      message: 'Memory deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/memories
// @desc    Delete all memories for user
// @access  Private
router.delete('/', async (req, res) => {
  try {
    await Memory.deleteMany({ userId: req.user._id });

    res.json({
      success: true,
      message: 'All memories deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

