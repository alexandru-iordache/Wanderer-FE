import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export function minimumAgeValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) {
      return null;
    }

    const today = new Date();
    const birthDate = new Date(control.value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();

    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= minAge ? null : { minimumAge: { value: control.value } };
  };
}

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) {
      return null;
    }

    const password = control.value;

    const hasUpperCase = /[A-Z]+/.test(password);
    const hasLowerCase = /[a-z]+/.test(password);
    const hasNumeric = /[0-9]+/.test(password);
    const hasSpecialChar = /[@$!%*?&]+/.test(password);

    const isValid = hasUpperCase && hasLowerCase && hasNumeric;

    return isValid ? null : { password: { value: control.value } };
  };
}

export function confirmPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const formGroup = control as FormGroup;

    const passwordControl = formGroup.get('password');
    const confirmPasswordControl = formGroup.get('confirmPassword');

    if (!passwordControl?.value || !confirmPasswordControl?.value) {
      return null;
    }

    if (passwordControl.value === confirmPasswordControl.value) {
      return null;
    } else {
      confirmPasswordControl.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
  };
}

export function datePickerValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const formGroup = control as FormGroup;

    const arrivalDateControl = formGroup.get('arrivalDate');
    const departureDateControl = formGroup.get('departureDate');

    if (!arrivalDateControl?.value || !departureDateControl?.value) {
      return null;
    }

    const arrivalDate = new Date(arrivalDateControl.value);
    const departureDate = new Date(departureDateControl.value);

    if (arrivalDate > departureDate) {
      return null;
    } else {
      departureDateControl.setErrors({ departureDateEarlier: true });
      return { departureDateEarlier: true };
    }
  };
}

export function endTimeValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const formGroup = control as FormGroup;

    const startHourControl = formGroup.get('startHour');
    const startMinutesControl = formGroup.get('startMinutes');
    const endHourControl = formGroup.get('endHour');
    const endMinutesControl = formGroup.get('endMinutes');

    if (
      !startHourControl?.value ||
      !startMinutesControl?.value ||
      !endHourControl?.value ||
      !endMinutesControl?.value
    ) {
      return null;
    }

    endHourControl.setErrors(null);
    endMinutesControl.setErrors(null);

    const startHour = parseInt(startHourControl!.value, 10);
    const endHour = parseInt(endHourControl!.value, 10);

    if (endHour < startHour) {
      endHourControl.setErrors({ endTimeEarlier: true });
      return { endTimeEarlier: true };
    }

    if (endHour == startHour) {
      const startMinutes = parseInt(startMinutesControl.value, 10);
      const endMinutes = parseInt(endMinutesControl.value, 10);

      if (startMinutes >= endMinutes) {
        endMinutesControl.setErrors({ endTimeEarlier: true });
        return { endTimeEarlier: true };
      }
    }

    return null;
  };
}
