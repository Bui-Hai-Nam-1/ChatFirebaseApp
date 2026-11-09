
import {
  ref,
  push,
  set,
  onValue,
  update,
  serverTimestamp,
  runTransaction,
} from 'firebase/database';

import { database } from './firebaseConfig';

// Tao ID co dinh cho cuoc tro chuyen 1-1
export const getChatId = (uid1, uid2) => {
  return [uid1, uid2].sort().join('_');
};

// Cap nhat thong tin cuoc tro chuyen
const updateChatInfo = async (
  senderId,
  receiverId,
  chatId,
  lastMessage,
) => {
  const senderPath = `userChats/${senderId}/${chatId}`;
  const receiverPath = `userChats/${receiverId}/${chatId}`;

  const updates = {};

  updates[`${senderPath}/chatId`] = chatId;
  updates[`${senderPath}/otherUid`] = receiverId;
  updates[`${senderPath}/lastMessage`] = lastMessage;
  updates[`${senderPath}/lastMessageAt`] = serverTimestamp();

  updates[`${receiverPath}/chatId`] = chatId;
  updates[`${receiverPath}/otherUid`] = senderId;
  updates[`${receiverPath}/lastMessage`] = lastMessage;
  updates[`${receiverPath}/lastMessageAt`] = serverTimestamp();

  await update(ref(database), updates);
};

// Tang so tin nhan chua doc
const increaseUnreadCount = async (receiverId, chatId) => {
  const unreadRef = ref(
    database,
    `userChats/${receiverId}/${chatId}/unreadCount`,
  );

  const result = await runTransaction(unreadRef, current => {
    return (Number(current) || 0) + 1;
  });

  if (!result.committed) {
    throw new Error('Khong the cap nhat so tin nhan chua doc.');
  }
};

// Gui tin nhan van ban
export const sendMessage = async (senderId, receiverId, text) => {
  const content = typeof text === 'string' ? text.trim() : '';

  if (!senderId || !receiverId || !content) {
    throw new Error('Thong tin tin nhan khong hop le.');
  }

  if (senderId === receiverId) {
    throw new Error('Khong the nhan tin cho chinh minh.');
  }

  const chatId = getChatId(senderId, receiverId);

  try {
    await updateChatInfo(
      senderId,
      receiverId,
      chatId,
      content,
    );

    const messagesRef = ref(
      database,
      `chats/${chatId}/messages`,
    );

    const newMessageRef = push(messagesRef);

    await set(newMessageRef, {
      id: newMessageRef.key,
      senderId,
      receiverId,
      text: content,
      type: 'text',
      createdAt: serverTimestamp(),
    });

    await increaseUnreadCount(receiverId, chatId);

    console.log('Gui tin nhan thanh cong');

    return chatId;
  } catch (error) {
    console.log('Loi gui tin nhan:', error);
    throw error;
  }
};

// Gui tin nhan vi tri
export const sendLocationMessage = async (
  senderId,
  receiverId,
  latitude,
  longitude,
) => {
  if (
    !senderId ||
    !receiverId ||
    senderId === receiverId ||
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('Thong tin vi tri khong hop le.');
  }

  const chatId = getChatId(senderId, receiverId);
  const locationText = 'Da gui vi tri';

  try {
    await updateChatInfo(
      senderId,
      receiverId,
      chatId,
      locationText,
    );

    const messagesRef = ref(
      database,
      `chats/${chatId}/messages`,
    );

    const newMessageRef = push(messagesRef);

    await set(newMessageRef, {
      id: newMessageRef.key,
      senderId,
      receiverId,
      text: locationText,
      type: 'location',
      latitude,
      longitude,
      createdAt: serverTimestamp(),
    });

    await increaseUnreadCount(receiverId, chatId);

    console.log('Gui vi tri thanh cong');

    return chatId;
  } catch (error) {
    console.log('Loi gui vi tri:', error);
    throw error;
  }
};

// Lang nghe tin nhan realtime
export const listenToMessages = (
  uid1,
  uid2,
  callback,
) => {
  if (!uid1 || !uid2) return () => {};

  const chatId = getChatId(uid1, uid2);
  const messagesRef = ref(
    database,
    `chats/${chatId}/messages`,
  );

  return onValue(
    messagesRef,
    snapshot => {
      const messages = [];

      snapshot.forEach(child => {
        messages.push({
          id: child.key,
          ...child.val(),
        });
      });

      messages.sort(
        (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
      );

      callback(messages);
    },
    error => {
      console.log('Loi lang nghe tin nhan:', error);
    },
  );
};

// Lang nghe danh sach hoi thoai realtime
export const listenToUserChats = (
  uid,
  callback,
) => {
  if (!uid) return () => {};

  const chatsRef = ref(database, `userChats/${uid}`);

  return onValue(
    chatsRef,
    snapshot => {
      const chats = [];

      snapshot.forEach(child => {
        chats.push({
          chatId: child.key,
          ...child.val(),
        });
      });

      chats.sort(
        (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0),
      );

      callback(chats);
    },
    error => {
      console.log('Loi lang nghe danh sach chat:', error);
    },
  );
};

// Danh dau cuoc tro chuyen da doc
export const markChatAsRead = async (uid, chatId) => {
  if (!uid || !chatId) return;

  try {
    await set(
      ref(database, `userChats/${uid}/${chatId}/unreadCount`),
      0,
    );
  } catch (error) {
    console.log('Loi danh dau da doc:', error);
    throw error;
  }
};
