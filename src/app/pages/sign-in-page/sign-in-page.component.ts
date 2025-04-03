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

    try {
      const rememberMe = this.loginForm.get('rememberMe')?.value;
      this.authService.setPersistence(rememberMe);
      await this.authService.signIn(email, password);

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
    if (this.registerForm.valid) {
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
      if (response.statusCode != 200) {
        // IMPORTANT: Snackbar handling
        console.log('Failed!');
        return;
      }

      this.router.navigate(['/dashboard']);
      return;
    } catch (error) {
      console.error('Error creating user in database', error);
      return;
    }
  }

  async signInWithGoogle() {
    let addUserDto: AddUserDto;
    try {
      const credential = await this.authService.signInWithGoogle();
      if (credential.user == null) {
        return;
      }

      if (credential.additionalUserInfo?.isNewUser == true) {
        this.router.navigate(['/dashboard']);
        console.log('New User');
        return;
      }

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
      const response = await this.userService.createUser(addUserDto);
      if (response.statusCode != 201 && response.statusCode != 409) {
        // IMPORTANT: Snackbar handling
        return;
      }
      console.log('User created in database', response.body);

      this.router.navigate(['/dashboard']);
      return;
    } catch (error) {
      // IMPORTANT: Snackbar handling
      alert('Unexpected error');
      console.error('Error creating user in database', error);
      return;
    }
  }

  setIsLogin(): void {
    this.isLogin = !this.isLogin;
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
    } else {
      alert('Error: ' + errorMessage);
    }
  }
}
