
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDN3f6zlQBK_nKdRHZOnm-JcgIw2xOgmLk',
  authDomain: 'chatfirebaseapp-5d3ed.firebaseapp.com',
  databaseURL:
    'https://chatfirebaseapp-5d3ed-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'chatfirebaseapp-5d3ed',
  storageBucket: 'chatfirebaseapp-5d3ed.firebasestorage.app',
  messagingSenderId: '455392163114',
  appId: '1:455392163114:web:a17f077039621ff0d79a53',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

const database = getDatabase(app);

export { app, auth, database };
