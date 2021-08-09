import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService } from './user.service';

@Injectable()
export class SiteAdminGuard implements CanActivate {
    router;
    userService;


    static parameters = [UserService, Router];
    constructor(userService: UserService, router: Router) {
        this.userService = userService;
        this.router = router;
    }


    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.userService.get().toPromise().then((res) => {
            if (res.role === "admin") {
                return true
            } else {
                this.router.navigate(['/home'], {
                    queryParams: {
                        error: "unauthorized"
                    }
                })
                return false
            }
        }).catch((err) => {
            this.router.navigate(['/login'], {
                queryParams: {
                    return: state.url,
                    alert: "auth-required"
                }
            })
            return false
        })
    }

}
