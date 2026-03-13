import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCh8C5HYEOifAozV_hSmMtjwQrtnzQBR-k",
  authDomain: "fatafatdecor-a4def.firebaseapp.com",
  projectId: "fatafatdecor-a4def",
  storageBucket: "fatafatdecor-a4def.firebasestorage.app",
  messagingSenderId: "915696529938",
  appId: "1:915696529938:web:52d1fc7a830bcca3f65ecb"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
export default app
