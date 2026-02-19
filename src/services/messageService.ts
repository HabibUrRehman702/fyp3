import apiClient, { ApiResponse, handleApiError } from './api';

export interface Message {
  _id: string;
  senderId: string | User;
  receiverId: string;
  senderType: 'doctor' | 'patient';
  receiverType: 'doctor' | 'patient';
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'doctor' | 'patient';
}

export interface Conversation {
  userId: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface SendMessageData {
  receiverId: string;
  receiverType: 'doctor' | 'patient';
  subject?: string;
  message: string;
}

class MessageService {
  // Get all conversations
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    try {
      const response = await apiClient.get('/api/messages/conversations');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get messages with a specific user
  async getConversation(userId: string): Promise<{ messages: Message[] }> {
    try {
      const response = await apiClient.get(`/api/messages/conversation/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Send message
  async sendMessage(data: SendMessageData): Promise<{ messageData: Message; message: string }> {
    try {
      const response = await apiClient.post('/api/messages/send', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Mark message as read
  async markAsRead(messageId: string): Promise<void> {
    try {
      await apiClient.put(`/api/messages/${messageId}/read`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const messageService = new MessageService();
