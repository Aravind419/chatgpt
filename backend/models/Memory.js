import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    index: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user_preference', 'conversation_context', 'fact', 'instruction'],
    default: 'fact'
  },
  tags: [{
    type: String
  }],
  importance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
memorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Memory = mongoose.model('Memory', memorySchema);

export default Memory;

