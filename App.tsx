
import React, { useEffect, useState, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  Linking,
  TouchableOpacity,
} from 'react-native';
import {
  listenToMessages,
  listenToUserChats,
  sendMessage,
  sendLocationMessage,
  markChatAsRead,
} from './src/services/chatService';
import {
  startPresence,
  listenToUsers,
} from './src/services/userService';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  registerUser,
  loginUser,
  logoutUser,
} from './src/services/authService';
import { getAuth } from 'firebase/auth';
import { app } from './src/services/firebaseConfig';
type UserData = {
  uid: string;
  fullName: string;
  email?: string;
  online?: boolean;
  lastSeen?: number;
};

type ChatData = {
  chatId: string;
  otherUid: string;
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCount?: number;
};
const auth = getAuth(app);
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      await loginUser(email, password);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ĐĂNG NHẬP</Text>

      <TextInput
        style={styles.input}
        placeholder="Nhập email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Nhập mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        onPress={handleLogin}
        disabled={loading}
      />

      <View style={{ marginTop: 15 }}>
        <Button
          title="Chưa có tài khoản? Đăng ký"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </View>
  );
}



function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);

    try {
      await registerUser(fullName, email, password);

      await logoutUser();

      Alert.alert(
        'Thành công',
        'Đăng ký thành công! Vui lòng đăng nhập.'
      );

      navigation.navigate('Login');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký tài khoản</Text>

      <TextInput
        style={styles.input}
        placeholder="Họ và tên"
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Xác nhận mật khẩu"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={loading ? 'Đang đăng ký...' : 'Đăng ký'}
        onPress={handleRegister}
        disabled={loading}
      />

      <Button
        title="Đã có tài khoản? Đăng nhập"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  );
}



function ContactsScreen({ navigation }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const unsubscribe = listenToUsers((data: any[]) => {
      console.log('DANH SÁCH USERS:', data);
      setUsers(data);
    });

    return unsubscribe;
  }, []);

  const currentUid = auth.currentUser?.uid;
  console.log('CURRENT UID:', currentUid);

  const filteredUsers = users.filter((item) => {
    const isNotMe = item.uid !== currentUid;
    const name = (item.fullName || '').toLowerCase();
    const keyword = searchText.trim().toLowerCase();

    return isNotMe && name.includes(keyword);
  });
  console.log('FILTERED USERS:', filteredUsers);

  return (
    <View style={[styles.container, { flex: 1, padding: 16 }]}>
      <Text style={styles.title}>Danh bạ</Text>

      <TextInput
        placeholder="Tìm kiếm theo tên..."
        value={searchText}
        onChangeText={setSearchText}
        style={{
          width: '100%',
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          paddingHorizontal: 12,
          marginVertical: 12,
        }}
      />

      <FlatList
        style={{ width: '100%', flex: 1 }}

        data={filteredUsers}
        
        keyExtractor={(item) => item.uid}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#777' }}>
            Chưa có người dùng nào.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('Chat', {
                otherUser: item,
              })
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#eee',
              width: '100%',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                {item.fullName || 'Người dùng'}
              </Text>

              <Text style={{ color: item.online ? 'green' : '#888' }}>
                {item.online ? '● Online' : '● Offline'}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}


function NotificationsScreen({ navigation }: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) return;

    const unsubscribeChats = listenToUserChats(currentUid, setChats);
    const unsubscribeUsers = listenToUsers(setUsers);

    return () => {
      unsubscribeChats?.();
      unsubscribeUsers?.();
    };
  }, [currentUid]);

  const notifications = chats
    .filter(chat => Number(chat.unreadCount || 0) > 0)
    .map(chat => {
      const otherUser = users.find(
        user => user.uid === chat.otherUid,
      );

      return {
        ...chat,
        otherUser,
      };
    })
    .filter(item => item.otherUser)
    .sort(
      (a, b) =>
        (b.lastMessageAt || 0) - (a.lastMessageAt || 0),
    );

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString('vi-VN');
  };

  const openNotification = async (item: any) => {
    try {
      await markChatAsRead(currentUid!, item.chatId);

      navigation.navigate('Contacts', {
        screen: 'Chat',
        params: {
          otherUser: item.otherUser,
        },
      });
    } catch (error) {
      Alert.alert('Thông báo', 'Không thể mở cuộc trò chuyện.');
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F4F6FA',
        padding: 16,
      }}
    >
      <Text style={styles.title}>Thông báo</Text>

      {notifications.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <Text style={{ fontSize: 40 }}>🔔</Text>
          <Text style={{ fontSize: 16, marginTop: 12 }}>
            Bạn chưa có thông báo mới.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.chatId}
          contentContainerStyle={{
            paddingBottom: 20,
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openNotification(item)}
              
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                padding: 14,
                marginBottom: 8,
                backgroundColor: '#FFFFFF',
                borderRadius: 10,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 45,
                  height: 45,
                  borderRadius: 23,
                  backgroundColor: '#DCEBFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 20, color: '#2563EB' }}>
                  {(item.otherUser.fullName || '?')
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 15 }}>
                  {item.otherUser.fullName}
                </Text>

                <Text numberOfLines={1} style={{ marginTop: 4 }}>
                  {item.lastMessage || 'Bạn có tin nhắn mới'}
                </Text>

                <Text style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                  {formatTime(item.lastMessageAt)}
                </Text>
              </View>

              <View
                style={{
                  minWidth: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: '#E53935',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 5,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12 }}>
                  {item.unreadCount}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}


function SettingsScreen() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await logoutUser();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cài đặt</Text>

      <Button
        title={loading ? 'Đang đăng xuất...' : 'Đăng xuất'}
        onPress={handleLogout}
        disabled={loading}
        color="#E53935"
      />
    </View>
  );
}


function AuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Đăng nhập' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Đăng ký' }}
      />
    </Stack.Navigator>
  );
}
const ContactsStack = createNativeStackNavigator();
function ChatScreen({ route, navigation }: any) {
  const { otherUser } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherOnline, setOtherOnline] = useState(
    !!otherUser.online,
  );

  const currentUid = auth.currentUser?.uid;
  const listRef = useRef<FlatList>(null);
  // Lang nghe trang thai online/offline cua doi phuong
  useEffect(() => {
    const unsubscribe = listenToUsers((users: UserData[]) => {
      const foundUser = users.find(
        (user: UserData) => user.uid === otherUser.uid,
      );

      if (foundUser) {
        setOtherOnline(!!foundUser.online);
      }
    });

    return unsubscribe;
  }, [otherUser.uid]);
  useEffect(() => {
    if (!currentUid || !otherUser?.uid || messages.length === 0) {
      return;
    }

    const chatId = [currentUid, otherUser.uid]
      .sort()
      .join('_');

    markChatAsRead(currentUid, chatId).catch(error => {
      console.log('Loi danh dau tin nhan da doc:', error);
    });
  }, [messages, currentUid, otherUser.uid]);
  // Cap nhat tieu de cuoc tro chuyen
  useEffect(() => {
    navigation.setOptions({
      title: `${otherUser.fullName || 'Trò chuyện'} • ${
        otherOnline ? 'Online' : 'Offline'
      }`,
    });
  }, [navigation, otherUser.fullName, otherOnline]);

  useEffect(() => {
    if (!currentUid || !otherUser?.uid) return;


    const unsubscribe = listenToMessages(
      currentUid,
      otherUser.uid,
      (data: any[]) => {
        setMessages(data);
      },
    );

    markChatAsRead(
      currentUid,
      [currentUid, otherUser.uid].sort().join('_'),
    ).catch(error => console.log('Lỗi đánh dấu đã đọc:', error));

    return unsubscribe;
  }, [currentUid, otherUser?.uid, navigation]);
const handleSendLocation = async () => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    Alert.alert('Thông báo', 'Bạn cần đăng nhập trước.');
    return;
  }

  try {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineGranted =
        result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;

      const coarseGranted =
        result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;

      if (!fineGranted && !coarseGranted) {
        Alert.alert(
          'Thông báo',
          'Bạn chưa cấp quyền truy cập vị trí.',
        );
        return;
      }
    }

    Geolocation.getCurrentPosition(
      async position => {
        try {
          await sendLocationMessage(
            currentUser.uid,
            otherUser.uid,
            position.coords.latitude,
            position.coords.longitude,
          );

          Alert.alert('Thành công', 'Đã gửi vị trí.');
        } catch (error) {
          console.log('Lỗi gửi vị trí:', error);
          Alert.alert('Lỗi', 'Không thể gửi vị trí.');
        }
      },
      error => {
        console.log('Lỗi lấy vị trí:', error);
        Alert.alert('Lỗi vị trí', error.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 10000,
      },
    );
  } catch (error) {
    console.log('Lỗi quyền vị trí:', error);
    Alert.alert('Lỗi', 'Không thể lấy vị trí.');
  }
};
  const handleSend = async () => {
    if (!messageText.trim() || !currentUid || sending) {
      return;
    }

    try {
      setSending(true);

      await sendMessage(
        currentUid,
        otherUser.uid,
        messageText,
      );

      setMessageText('');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không gửi được tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F5F5F5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12 }}
        data={messages}
        keyExtractor={item => item.id}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#888' }}>
            Chưa có tin nhắn. Hãy gửi lời chào nhé!
          </Text>
        }
        renderItem={({ item }) => {
          const isMine = item.senderId === currentUid;

          return (
            <View
              style={{
                alignSelf: isMine ? 'flex-end' : 'flex-start',
                backgroundColor: isMine ? '#DCF8C6' : '#FFFFFF',
                padding: 10,
                borderRadius: 12,
                marginVertical: 5,
                maxWidth: '80%',
              }}
            >
              {item.type === 'location' ? (
                <Pressable
                  onPress={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
                    Linking.openURL(url).catch(() =>
                      Alert.alert('Lỗi', 'Không thể mở bản đồ.'),
                    );
                  }}
                >
                  <Text style={{ color: '#2563EB', textDecorationLine: 'underline' }}>
                    📍 Xem vị trí trên Google Maps
                  </Text>
                </Pressable>
              ) : (
                <Text style={{ fontSize: 16, color: '#222' }}>
                  {item.text}
                </Text>
              )}

              <Text
                style={{
                  fontSize: 10,
                  color: '#777',
                  textAlign: 'right',
                  marginTop: 4,
                }}
              >
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Đang gửi...'}
              </Text>
            </View>
          );
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          padding: 10,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
        }}
      >
        <Button
          title="Vị trí"
          onPress={handleSendLocation}
        />
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#DDD',
            borderRadius: 22,
            paddingHorizontal: 15,
            paddingVertical: 9,
            maxHeight: 100,
          }}
          placeholder="Nhập tin nhắn..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />

        <View style={{ marginLeft: 8 }}>
          <Button
            title={sending ? '...' : 'Gửi'}
            onPress={handleSend}
            disabled={sending || !messageText.trim()}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
function ContactsStackNavigator() {
  return (
    <ContactsStack.Navigator>
      <ContactsStack.Screen
        name="ContactsList"
        component={ContactsScreen}
        options={{ title: 'Danh bạ' }}
      />

      <ContactsStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Trò chuyện' }}
      />
    </ContactsStack.Navigator>
  );
}

function HomeScreen({ navigation }: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) return;

    const unsubscribeChats = listenToUserChats(
      currentUid,
      (data: any[]) => setChats(data),
    );

    const unsubscribeUsers = listenToUsers(
      (data: any[]) => setUsers(data),
    );

    return () => {
      unsubscribeChats();
      unsubscribeUsers();
    };
  }, [currentUid]);

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString('vi-VN');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F6FA' }}>
      <Text
        style={{
          fontSize: 25,
          fontWeight: 'bold',
          color: '#222',
          padding: 18,
        }}>
        Tin nhắn
      </Text>

      <FlatList
        data={chats}
        keyExtractor={item => item.chatId}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: 'center',
              color: '#888',
              marginTop: 40,
            }}>
            Bạn chưa có cuộc trò chuyện nào.
          </Text>
        }
        renderItem={({ item }) => {
          const otherUser = users.find(
            user => user.uid === item.otherUid,
          );

          if (!otherUser) return null;

          const initial = (otherUser.fullName || '?')
            .trim()
            .charAt(0)
            .toUpperCase();

          return (
            <Pressable
              onPress={() =>
                navigation.navigate('Contacts', {
                  screen: 'Chat',
                  params: { otherUser },
                })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                padding: 14,
                marginBottom: 9,
                borderRadius: 14,
              }}>

              {/* Avatar */}
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: '#DCE8FF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: 'bold',
                    color: '#2864C5',
                  }}>
                  {initial}
                </Text>

                {otherUser.online && (
                  <View
                    style={{
                      position: 'absolute',
                      width: 13,
                      height: 13,
                      borderRadius: 7,
                      backgroundColor: '#2ECC71',
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                      right: 0,
                      bottom: 0,
                    }}
                  />
                )}
              </View>

              {/* Thông tin cuộc trò chuyện */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#222',
                  }}>
                  {otherUser.fullName || 'Người dùng'}
                </Text>

                <Text
                  numberOfLines={1}
                  style={{
                    color: '#777',
                    marginTop: 5,
                  }}>
                  {item.lastMessage || 'Chưa có tin nhắn'}
                </Text>
              </View>

              {/* Thời gian và tin chưa đọc */}
              <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                <Text style={{ fontSize: 11, color: '#999' }}>
                  {formatTime(item.lastMessageAt)}
                </Text>

                {item.unreadCount > 0 && (
                  <View
                    style={{
                      backgroundColor: '#2878F0',
                      minWidth: 22,
                      height: 22,
                      borderRadius: 11,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 5,
                      marginTop: 7,
                    }}>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 'bold',
                      }}>
                      {item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}


function MainNavigator() {
  const [totalUnread, setTotalUnread] = useState(0);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) return;

    const unsubscribe = listenToUserChats(
  currentUid,
  (chats: ChatData[]) => {
    const total = chats.reduce(
      (sum: number, chat: ChatData) =>
        sum + Number(chat.unreadCount || 0),
      0,
    );

    setTotalUnread(total);
  },
);

    return unsubscribe;
  }, [currentUid]);

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Trang chủ' }}
      />

      <Tab.Screen
        name="Contacts"
        component={ContactsStackNavigator}
        options={{ title: 'Danh bạ' }}
      />

      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Thông báo',
          tabBarBadge:
            totalUnread > 0 ? totalUnread : undefined,
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Cài đặt' }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);
  useEffect(() => {
    if (!user) return;

    const stopPresence = startPresence(user.uid);

    return stopPresence;
  }, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Đang tải ứng dụng...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  error: {
    color: 'red',
    marginBottom: 12,
  },
});
