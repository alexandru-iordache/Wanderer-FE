import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-sign-in-page',
  templateUrl: './sign-in-page.component.html',
  styleUrl: './sign-in-page.component.scss'
})
export class SignInPageComponent implements OnInit {

  isLogin: boolean = true;
  loginForm: FormGroup = new FormGroup({});
  registerForm: FormGroup = new FormGroup({});

  constructor(private formBuilder: FormBuilder) {
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.formBuilder.group({
      profileName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  onLoginSubmit(): void {

  }

  setIsLogin(): void {
    this.isLogin = !this.isLogin;
  }
}
