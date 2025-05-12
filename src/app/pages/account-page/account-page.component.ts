import { Component, OnInit } from '@angular/core';
import { UserDto } from '../../interfaces/dtos/response/user-dto';
import { UserService } from '../../services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { minimumAgeValidator } from '../../shared/helpers/validators';

@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent implements OnInit {
  userDetails: UserDto | null = null;

  userDetailsForm: FormGroup = new FormGroup({});

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder
  ) {}

  async ngOnInit(): Promise<void> {
    this.userDetails = (await this.userService.getUserDetails()).body;

    this.userDetailsForm = this.formBuilder.group({
      profileName: [this.userDetails?.profileName, [Validators.required]],
      email: [this.userDetails?.email, [Validators.required, Validators.email]],
      birthDate: [
        this.userDetails?.birthDate,
        [Validators.required, minimumAgeValidator(18)],
      ],
    });

    this.userDetailsForm.get('email')?.disable();
  }

  onFormSubmit() {}
}
