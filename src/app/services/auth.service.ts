import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  setPersistence,
} from 'firebase/auth';
import { TokenRefreshService } from './token-refresh.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private auth: AngularFireAuth,
    private tokenRefreshService: TokenRefreshService
  ) {}

  async signUp(email: string, password: string) {
    try {
      var result = this.auth.createUserWithEmailAndPassword(email, password);
      this.tokenRefreshService.startTokenRefreshJob();
      return result;
    } catch (error) {
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      var result = this.auth.signInWithEmailAndPassword(email, password);
      this.tokenRefreshService.startTokenRefreshJob();
      return result;
    } catch (error) {
      throw error;
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      var result = this.auth.signInWithPopup(provider);
      this.tokenRefreshService.startTokenRefreshJob();
      return result;
    } catch (error) {
      throw error;
    }
  }

  async signOut() {
    this.tokenRefreshService.stopTokenRefreshJob();
    return this.auth.signOut();
  }

  getAuthState() {
    return this.auth.authState;
  }

  setPersistence(rememberMe: boolean) {
    setPersistence(
      getAuth(),
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    ).catch((error) => {
      throw error;
    });
  }

  async getIdToken() {
    return (await this.auth.currentUser)?.getIdToken();
  }
}
