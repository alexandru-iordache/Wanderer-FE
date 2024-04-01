import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { confirmPasswordValidator, minimumAgeValidator, passwordValidator } from '../../shared/helpers/validators';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-in-page',
  templateUrl: './sign-in-page.component.html',
  styleUrl: './sign-in-page.component.scss'
})
export class SignInPageComponent implements OnInit {

  isLogin: boolean = true;
  loginForm: FormGroup = new FormGroup({});
  registerForm: FormGroup = new FormGroup({});

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    this.registerForm = this.formBuilder.group({
      profileName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), passwordValidator()]],
      confirmPassword: ['', [Validators.required]],
      birthDate: ['', [Validators.required, minimumAgeValidator(18)]]
    }, { validators: confirmPasswordValidator() });
  }

  async onLoginSubmit() {
    if (this.loginForm.valid) {
      const email = this.loginForm.get('email')?.value;
      const password = this.loginForm.get('password')?.value;

      try {
        const rememberMe = this.loginForm.get('rememberMe')?.value;
        this.authService.setPersistence(rememberMe);
        await this.authService.signIn(email, password);
        this.router.navigate(['/dashboard']);
      } catch (error) {
        // IMPORTANT: Add error handling
        console.log('failed');
        this.router.navigate(['/']);
      }
    }
  }

  async onRegisterSubmit() {
    if (this.registerForm.valid) {
      const email = this.registerForm.get('email')?.value;
      const password = this.registerForm.get('password')?.value;

      try {
        await this.authService.signUp(email, password);
        this.router.navigate(['/dashboard']);
      }
      catch (error) {
        // IMPORTANT: Add error handling
        console.log("Failed!");
        this.router.navigate(['/']);
      }
    }
  }

  async signInWithGoogle() {
    console.log("pressed");
    try {
      await this.authService.signInWithGoogle();
    } catch (error) {
      console.log("errrorror!");
    }
  }

  setIsLogin(): void {
    this.isLogin = !this.isLogin;
  }
}
