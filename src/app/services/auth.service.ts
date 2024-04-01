import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider, browserLocalPersistence, browserSessionPersistence, getAuth, setPersistence } from 'firebase/auth';
import firebase from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: AngularFireAuth) {
  }

  async signUp(email: string, password: string) {
    return this.auth.createUserWithEmailAndPassword(email, password);
  }

  async signIn(email: string, password: string) {
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return this.auth.signInWithPopup(provider);
  }

  async signOut() {
    return this.auth.signOut();
  }

  getAuthState() {
    return this.auth.authState;
  }

  setPersistence(rememberMe: boolean) {
    setPersistence(getAuth(), rememberMe ? browserLocalPersistence : browserSessionPersistence)
      .catch((error) => {
        throw error;
      })
  }

  async getIdToken() {
    return (await this.auth.currentUser)?.getIdToken();
  }
}