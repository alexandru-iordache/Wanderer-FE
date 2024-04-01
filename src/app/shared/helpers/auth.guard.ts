import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { inject } from '@angular/core';
import { firstValueFrom, map, take } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);

  if (await isAuthenticated()) {
    return true;
  }

  router.navigate(['/sign-in']);
  return false;
};

export const nonAuthGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);

  if (!(await isAuthenticated())) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
}

export const isAuthenticated = async () => {
  const authService = inject(AuthService);

  const authState$ = authService.getAuthState().pipe(
    take(1),
    map(user => !!user)
  );

  return await firstValueFrom(authState$);
}