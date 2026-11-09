
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import {
  ref,
  set,
  serverTimestamp,
} from 'firebase/database';

import { auth, database } from './firebaseConfig';

// Đăng ký tài khoản
export const registerUser = async (fullName, email, password) => {
  const name = fullName.trim();
  const userEmail = email.trim().toLowerCase();

  if (!name || !userEmail || !password) {
    throw new Error('Vui lòng nhập đầy đủ thông tin.');
  }

  if (password.length < 6) {
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      userEmail,
      password,
    );

    const user = credential.user;

    await updateProfile(user, {
      displayName: name,
    });

    await set(ref(database, `users/${user.uid}`), {
      uid: user.uid,
      fullName: name,
      email: userEmail,
      online: false,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return user;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Đăng nhập
export const loginUser = async (email, password) => {
  if (!email.trim() || !password) {
    throw new Error('Vui lòng nhập email và mật khẩu.');
  }

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );

    return credential.user;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Đăng xuất
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error('Không thể đăng xuất. Vui lòng thử lại.');
  }
};

// Chuyển mã lỗi Firebase thành thông báo tiếng Việt
const getAuthErrorMessage = code => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký.';
    case 'auth/invalid-email':
      return 'Email không hợp lệ.';
    case 'auth/weak-password':
      return 'Mật khẩu phải có ít nhất 6 ký tự.';
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không chính xác.';
    case 'auth/user-not-found':
      return 'Không tìm thấy tài khoản.';
    case 'auth/wrong-password':
      return 'Mật khẩu không chính xác.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng thử lại.';
    default:
      return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }
};
