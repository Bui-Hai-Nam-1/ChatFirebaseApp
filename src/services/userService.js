
import {
  ref,
  onValue,
  query,
  orderByChild,
  set,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';

import { database } from './firebaseConfig';

// Lắng nghe danh sách người dùng realtime
export const listenToUsers = (callback) => {
  const usersQuery = query(
    ref(database, 'users'),
    orderByChild('fullName'),
  );

  const unsubscribe = onValue(usersQuery, (snapshot) => {
    const users = [];

    snapshot.forEach((child) => {
      users.push({
        uid: child.key,
        ...child.val(),
      });
    });

    callback(users);
  });

  return unsubscribe;
};

// Theo dõi trạng thái online/offline tự động
export const startPresence = (uid) => {
  if (!uid) return () => {};

  const connectedRef = ref(database, '.info/connected');
  const onlineRef = ref(database, `users/${uid}/online`);
  const lastSeenRef = ref(database, `users/${uid}/lastSeen`);

  let active = true;
  let unsubscribe = () => {};

  unsubscribe = onValue(connectedRef, async (snapshot) => {
    if (!active || snapshot.val() !== true) return;

    try {
      // Đăng ký trạng thái offline khi mất kết nối
      await onDisconnect(onlineRef).set(false);

      // Cập nhật thời điểm hoạt động cuối
      await onDisconnect(lastSeenRef).set(serverTimestamp());

      if (!active) return;

      // Đánh dấu người dùng đang online
      await set(onlineRef, true);
    } catch (error) {
      console.log('Lỗi cập nhật trạng thái:', error);
    }
  });

  // Hàm dọn dẹp khi đăng xuất
  return () => {
    active = false;
    unsubscribe();

    onDisconnect(onlineRef).cancel().catch(() => {});

    set(onlineRef, false).catch(() => {});
    set(lastSeenRef, serverTimestamp()).catch(() => {});
  };
};
