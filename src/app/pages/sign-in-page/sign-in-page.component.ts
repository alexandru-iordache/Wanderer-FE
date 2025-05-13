import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  confirmPasswordValidator,
  minimumAgeValidator,
  passwordValidator,
} from '../../shared/helpers/validators';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AddUserDto } from '../../interfaces/dtos/request/add-user-dto';
import { FirebaseError } from 'firebase/app';
import { UserDto } from '../../interfaces/dtos/response/user-dto';

@Component({
  selector: 'app-sign-in-page',
  templateUrl: './sign-in-page.component.html',
  styleUrl: './sign-in-page.component.scss',
})
export class SignInPageComponent implements OnInit {
  isLogin: boolean = true;
  loginForm: FormGroup = new FormGroup({});
  registerForm: FormGroup = new FormGroup({});

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false],
    });

    this.registerForm = this.formBuilder.group(
      {
        profileName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [Validators.required, Validators.minLength(8), passwordValidator()],
        ],
        confirmPassword: ['', [Validators.required]],
        birthDate: ['', [Validators.required, minimumAgeValidator(18)]],
      },
      { validators: confirmPasswordValidator() }
    );
  }

  async onLoginSubmit() {
    if (!this.loginForm.valid) {
      return;
    }

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;
    const rememberMe = this.loginForm.get('rememberMe')?.value;

    try {
      this.authService.setPersistence(rememberMe);
      await this.authService.signIn(email, password);

      await this.SaveAccessTokenToStorage(rememberMe);

      var isSucces = await this.TrySaveUserDetailsToStorage(rememberMe);
      if (!isSucces) {
        alert('Error getting user details');
        await this.authService.signOut();
        return;
      }

      this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      // IMPORTANT: Snackbar handling
      if (error instanceof FirebaseError) {
        this.HandleFirebaseError(error);
      } else {
        alert('Unexpected error: ' + error);
      }
    }
  }

  async onRegisterSubmit() {
    if (!this.registerForm.valid) {
      return;
    }

    const username = this.registerForm.get('profileName')?.value;

    const email = this.registerForm.get('email')?.value;
    const password = this.registerForm.get('password')?.value;

    let addUserDto: AddUserDto;
    try {
      const credential = await this.authService.signUp(email, password);
      if (credential.user == null) {
        // IMPORTANT: Snackbar handling
        console.log('Failed!');
        return;
      }

      await this.SaveAccessTokenToStorage(false);

      addUserDto = {
        profileName: username ?? 'No name',
        email: credential.user.email ?? 'No email',
      } as AddUserDto;
    } catch (error) {
      // IMPORTANT: Snackbar handling
      if (error instanceof FirebaseError) {
        this.HandleFirebaseError(error);
      } else {
        alert('Unexpected error: ' + error);
      }
      return;
    }

    try {
      var response = await this.userService.createUser(addUserDto);
      if (response.statusCode != 201) {
        await this.authService.signOut();
        // IMPORTANT: Snackbar handling
        console.log('Failed!');
        return;
      }

      var isSucces = await this.TrySaveUserDetailsToStorage(
        false,
        response.body
      );
      if (!isSucces) {
        alert('Error getting user details');
        await this.authService.signOut();
        return;
      }

      this.router.navigate(['/dashboard']);
      return;
    } catch (error) {
      await this.authService.signOut();
      console.error('Error creating user in database', error);
      return;
    }
  }

  async signInWithGoogle() {
    let addUserDto: AddUserDto;
    let isNewUser: boolean = true;
    try {
      const credential = await this.authService.signInWithGoogle();
      if (credential.user == null) {
        return;
      }

      isNewUser = credential.additionalUserInfo?.isNewUser ?? true;

      await this.SaveAccessTokenToStorage(true);

      addUserDto = {
        profileName: credential.user.displayName ?? 'No name',
        email: credential.user.email ?? 'No email',
      } as AddUserDto;
    } catch (error) {
      // IMPORTANT: Snackbar handling
      if (error instanceof FirebaseError) {
        this.HandleFirebaseError(error);
      } else {
        alert('Unexpected error: ' + error);
      }
      return;
    }

    try {
      let userDetails: UserDto | null = null;
      if (isNewUser) {
        const response = await this.userService.createUser(addUserDto);
        if (response.statusCode != 201 && response.statusCode != 409) {
          // IMPORTANT: Snackbar handling
          await this.authService.signOut();
          alert('Error creating user in database');
          return;
        }
        userDetails = response.body;
      } else {
        const response = await this.userService.getUserDetailsAsync();
        if (response.statusCode != 200) {
          // IMPORTANT: Snackbar handling
          await this.authService.signOut();
          alert('Error getting user details');
          return;
        }
        userDetails = response.body;
      }

      var isSucces = await this.TrySaveUserDetailsToStorage(false, userDetails);
      if (!isSucces) {
        alert('Error saving user details to storage');
        await this.authService.signOut();
        return;
      }

      this.router.navigate(['/dashboard']);
      return;
    } catch (error) {
      await this.authService.signOut();
      // IMPORTANT: Snackbar handling
      alert('Unexpected error');
      console.error('Error creating user in database', error);
      return;
    }
  }

  setIsLogin(): void {
    this.isLogin = !this.isLogin;
  }

  private async SaveAccessTokenToStorage(rememberMe: boolean) {
    var accessId = await this.authService.getIdToken();
    if (rememberMe) {
      localStorage.setItem('idToken', accessId!);
    } else {
      sessionStorage.setItem('idToken', accessId!);
    }
  }

  private async TrySaveUserDetailsToStorage(
    rememberMe: boolean,
    userDetails: UserDto | null = null
  ): Promise<boolean> {
    try {
      if (userDetails === null) {
        var userDetailsResponse = await this.userService.getUserDetailsAsync();
        if (userDetailsResponse.statusCode != 200) {
          return false;
        }

        userDetails = userDetailsResponse.body;
      }

      localStorage.setItem('userId', userDetails.id);
      localStorage.setItem('profileName', userDetails.profileName);

      return true;
    } catch (error) {
      console.error('Error getting user details', error);
      return false;
    }
  }

  private HandleFirebaseError(error: FirebaseError) {
    var errorCode = error.code;
    var errorMessage = error.message;

    if (
      errorCode === 'auth/wrong-password' ||
      errorCode === 'auth/invalid-credential'
    ) {
      alert('Wrong password.');
    } else if (errorCode === 'auth/email-already-in-use') {
      alert('Email already in use.');
    } else if (errorCode === 'auth/cancelled-popup-request') {
      return;
    } else {
      alert('Error: ' + errorMessage);
    }
  }
}
