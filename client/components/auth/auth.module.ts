import { NgModule } from '@angular/core';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { AuthGuard } from './auth-guard.service';
import { SiteAdminGuard } from './site-admin-guard.service';

@NgModule({
    providers: [
        AuthService,
        UserService,
        AuthGuard,
        SiteAdminGuard,
    ]
})
export class AuthModule { }
