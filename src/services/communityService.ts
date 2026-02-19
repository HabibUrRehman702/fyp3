import apiClient, { ApiResponse, handleApiError } from './api';

export interface CommunityPost {
  _id: string;
  authorId: string | PostAuthor;
  content: string;
  likes: string[];
  createdAt: string;
  updatedAt: string;
  replyCount?: number;
}

export interface CommunityReply {
  _id: string;
  postId: string;
  authorId: string | PostAuthor;
  content: string;
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

interface PostAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  userType: 'doctor' | 'patient';
}

export interface CreatePostData {
  content: string;
}

export interface CreateReplyData {
  content: string;
}

class CommunityService {
  // Get all posts
  async getPosts(): Promise<{ posts: CommunityPost[] }> {
    try {
      const response = await apiClient.get('/api/community/posts');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get single post with replies
  async getPost(postId: string): Promise<{ post: CommunityPost }> {
    try {
      const response = await apiClient.get(`/api/community/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get replies for a post
  async getReplies(postId: string): Promise<{ replies: CommunityReply[] }> {
    try {
      const response = await apiClient.get(`/api/community/posts/${postId}/replies`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Create post
  async createPost(data: CreatePostData): Promise<{ post: CommunityPost; message: string }> {
    try {
      const response = await apiClient.post('/api/community/posts', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Create reply
  async createReply(postId: string, data: CreateReplyData): Promise<{ reply: CommunityReply; message: string }> {
    try {
      const response = await apiClient.post(`/api/community/posts/${postId}/replies`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Like post
  async likePost(postId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`/api/community/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Like reply
  async likeReply(replyId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`/api/community/replies/${replyId}/like`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Delete post
  async deletePost(postId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete(`/api/community/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Delete reply
  async deleteReply(replyId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete(`/api/community/replies/${replyId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const communityService = new CommunityService();
