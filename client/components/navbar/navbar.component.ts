// import { Component } from '@angular/core';
// import { Router } from '@angular/router';
// import { AuthService } from '../auth/auth.service';
// import {BsDropdownDirective, BsDropdownModule, BsDropdownToggleDirective} from 'ngx-bootstrap/dropdown';
// import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
//
// @Component({
//     selector: 'navbar',
//     templateUrl: './navbar.html',
//     styleUrls: ['./navbar.scss'],
//     providers: [BsDropdownModule, BsDropdownDirective, BsDropdownToggleDirective]
// })
//
// export class NavbarComponent {
//     isCollapsed = true;
//     navbarOpen = false;   // store state
//
//     menu = [
//         {
//             title: 'HOME',
//             link: '/home'
//         },
//         {
//             title: 'ORGANIZATIONS',
//             link: '/map-search'
//
//         },
//         {
//             title: 'RESOURCES',
//             link: '/resources'
//         },
//         {
//             title: 'EVENTS',
//             link: '/events'
//         },
//         {
//             title: 'FUNDING',
//             link: '/funding'
//         },
//     ];
//
//     isAdmin;
//     isLoggedIn;
//     currentUser = {};
//     bsModalRef: BsModalRef;
//     static parameters = [AuthService, Router, BsModalService];
//     constructor(public authService: AuthService, public router: Router, private modalService: BsModalService ) {
//         this.authService = authService;
//         this.router = router;
//
//         this.reset();
//
//         this.authService.currentUserChanged.subscribe(user => {
//             this.currentUser = user;
//             this.reset();
//         });
//     }
//
//     /** On small screens, toggle to dropdown navbar visibility
//      * @param toState: an optional override to manually set the navbar's visibility
//      */
//     toggleDropdownNavbarVisibility(toState?: boolean) {
//         this.isCollapsed = !!toState ? toState : !this.isCollapsed;
//         return this.isCollapsed;
//     }
//
//     /**
//      * navbarIsExpanded: determine whether the navbar is expanded (min-width > 1200px)
//      *    inspects the navbar to see if it is in its expanded display mode
//      *    (links appearing without having to click the toggle-navbar btn)
//      */
//     navbarIsExpanded(): boolean {
//         const element = document.querySelector('.navbar-collapse');
//         const style = getComputedStyle(element);
//         // 'flex' -> expanded ; 'none' -> collapsed
//         return style.display === 'flex';
//     }
//
//     reset() {
//         this.authService.isLoggedIn().then(is => {
//             this.isLoggedIn = is;
//         });
//         this.authService.isAdmin().then(is => {
//             this.isAdmin = is;
//         });
//         this.authService.getCurrentUser().then(user => {
//             this.currentUser = user;
//         });
//     }
//
//     logout() {
//         return this.authService.logout().then(() => {
//             this.router.navigateByUrl('/home');
//             this.reset();
//         });
//     }
//     login(){
//     }
//
// }
