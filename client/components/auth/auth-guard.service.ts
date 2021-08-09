import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService } from './user.service';

@Injectable()
export class AuthGuard implements CanActivate {
    router;
    userService;


    static parameters = [UserService, Router];
    constructor(userService: UserService, router: Router) {
        this.userService = userService;
        this.router = router;
    }


    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.userService.get()
            .toPromise()
            .then((res) => true)
            .catch((err) => {
                this.router.navigate(['/login'], {
                    queryParams: {
                        return: state.url,
                        alert: 'auth-required'
                    }
                })
            return false;
            });
    }
}
