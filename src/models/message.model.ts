import mongoose from 'mongoose';

export interface Message {
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  timestamp: Date;
  isRead: boolean;
}

export const messageSchema = new mongoose.Schema<Message>({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

// export const MessageModel = mongoose.model<Message>('Message', messageSchema);
