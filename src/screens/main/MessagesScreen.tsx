import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { MaterialTopTabBarProps, createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import io, { Socket } from 'socket.io-client';
import apiClient from '../../config/api';
import { COLORS } from '../../config/constants';
import { authService } from '../../services/authService';
import { messageService, Message as ServiceMessage, Conversation as ServiceConversation } from '../../services/messageService';
import { communityService, CommunityPost as ServiceCommunityPost } from '../../services/communityService';
import { xrayService } from '../../services/xrayService';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';

const Tab = createMaterialTopTabNavigator();

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: string[];
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessage: Message;
  unreadCount: number;
}

interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

const MessagesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    };
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      const newSocket = io(apiClient.defaults.baseURL!, {
        auth: { token: user.token },
      });
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        id="messages-tabs"
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarIndicatorStyle: { backgroundColor: COLORS.primary },
          tabBarStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Tab.Screen name="Doctor Chat" component={DoctorChatTab} />
        <Tab.Screen name="Community" component={CommunityTab} />
      </Tab.Navigator>
    </View>
  );
};

const DoctorChatTab: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const initializeUser = async () => {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    };
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      const newSocket = io(apiClient.defaults.baseURL!, {
        auth: { token: user.token },
      });
      setSocket(newSocket);

      newSocket.on('newMessage', (message: Message) => {
        if (selectedConversation && (message.senderId === selectedConversation.participantId || message.receiverId === selectedConversation.participantId)) {
          setMessages(prev => [...prev, message]);
        }
        // Update conversations list
        loadConversations();
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await messageService.getConversations();
      // Map service conversations to local interface
      const mappedConversations: Conversation[] = convs.conversations.map((conv: ServiceConversation) => ({
        id: conv.userId,
        participantId: conv.userId,
        participantName: typeof conv.user === 'object' ? `${conv.user.firstName} ${conv.user.lastName}` : conv.user,
        participantRole: typeof conv.user === 'object' ? conv.user.userType : 'unknown',
        lastMessage: {
          id: 'last',
          senderId: '',
          receiverId: '',
          content: conv.lastMessage,
          timestamp: conv.lastMessageTime,
          isRead: false,
        },
        unreadCount: conv.unreadCount,
      }));
      setConversations(mappedConversations);
    } catch (error) {
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const msgs = await messageService.getConversation(conversationId);
      // Map service messages to local interface
      const mappedMessages: Message[] = msgs.messages.map((msg: ServiceMessage) => ({
        id: msg._id,
        senderId: typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId,
        receiverId: msg.receiverId,
        content: msg.message,
        timestamp: msg.createdAt,
        isRead: msg.isRead,
      }));
      setMessages(mappedMessages);
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    try {
      await messageService.sendMessage({
        receiverId: selectedConversation!.participantId,
        receiverType: selectedConversation!.participantRole as 'doctor' | 'patient',
        message: newMessage,
        // Note: attachments not supported in current API
      });
      setNewMessage('');
      setAttachments([]);
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const pickImage = async () => {
    // For now, just show alert that attachments are not supported
    Alert.alert('Info', 'Image attachments are not yet supported in chat');
  };

  useFocusEffect(
    React.useCallback(() => {
      loadConversations();
    }, [])
  );

  if (selectedConversation) {
    return (
      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedConversation(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.chatTitle}>{selectedConversation.participantName}</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[
              styles.messageBubble,
              item.senderId === user?.id ? styles.sentMessage : styles.receivedMessage
            ]}>
              <Text style={styles.messageText}>{item.content}</Text>
              {item.attachments && item.attachments.map((url: string, index: number) => (
                <Image key={index} source={{ uri: url }} style={styles.attachmentImage} />
              ))}
              <Text style={styles.messageTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
            </View>
          )}
          style={styles.messagesList}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.attachButton}>
            <Text style={styles.attachButtonText}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Doctor Chat</Text>
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => {
                setSelectedConversation(item);
                loadMessages(item.id);
              }}
            >
              <View style={styles.conversationInfo}>
                <Text style={styles.conversationName}>{item.participantName}</Text>
                <Text style={styles.conversationRole}>{item.participantRole}</Text>
                <Text style={styles.lastMessage}>{item.lastMessage.content}</Text>
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const CommunityTab: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const loadPosts = async () => {
    try {
      setLoading(true);
      const communityPosts = await communityService.getPosts();
      // Map service posts to local interface
      const mappedPosts: CommunityPost[] = communityPosts.posts.map((post: ServiceCommunityPost) => ({
        id: post._id,
        authorId: typeof post.authorId === 'object' ? post.authorId._id : post.authorId,
        authorName: typeof post.authorId === 'object' ? `${post.authorId.firstName} ${post.authorId.lastName}` : 'Unknown',
        authorRole: typeof post.authorId === 'object' ? post.authorId.userType : 'unknown',
        title: 'Post', // Service doesn't have title
        content: post.content,
        timestamp: post.createdAt,
        likes: post.likes.length,
        comments: post.replyCount || 0,
        isLiked: false, // Would need to check if current user liked it
      }));
      setPosts(mappedPosts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim()) return;

    try {
      await communityService.createPost({ content: newPostContent });
      setNewPostTitle('');
      setNewPostContent('');
      setShowCreatePost(false);
      loadPosts();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const likePost = async (postId: string) => {
    // Like functionality not implemented in current API
    Alert.alert('Info', 'Like functionality coming soon');
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPosts();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.communityHeader}>
        <Text style={styles.sectionTitle}>Community</Text>
        <TouchableOpacity onPress={() => setShowCreatePost(true)} style={styles.createPostButton}>
          <Text style={styles.createPostButtonText}>+ New Post</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.postCard}>
              <View style={styles.postHeader}>
                <Text style={styles.postAuthor}>{item.authorName} ({item.authorRole})</Text>
                <Text style={styles.postTime}>{new Date(item.timestamp).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.postTitle}>{item.title || 'Post'}</Text>
              <Text style={styles.postContent}>{item.content}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity onPress={() => likePost(item.id)} style={styles.actionButton}>
                  <Text style={item.isLiked ? styles.likedText : styles.actionText}>
                    👍 {item.likes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionText}>💬 {item.comments}</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}

      <Modal visible={showCreatePost} animationType="slide">
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreatePost(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity onPress={createPost}>
              <Text style={styles.postButton}>Post</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.contentInput}
              value={newPostContent}
              onChangeText={setNewPostContent}
              placeholder="Share your thoughts..."
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: 16,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: 18,
    color: COLORS.primary,
    marginRight: 16,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  conversationRole: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.card,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.text,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachButton: {
    marginRight: 8,
  },
  attachButtonText: {
    fontSize: 24,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  createPostButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createPostButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  postCard: {
    margin: 16,
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  postTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  likedText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelButton: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  postButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    height: 200,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    fontSize: 16,
  },
});

export default MessagesScreen;
