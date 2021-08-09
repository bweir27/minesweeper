// import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
// import {AccordionModule} from 'ngx-bootstrap/accordion';
// import {AuthService} from '../auth/auth.service';
// import {Router} from '@angular/router';
// import {OrganizationService} from '../../services/organization/organization.service';
// import {HttpClient} from '@angular/common/http';
// import { AccordionConfig } from 'ngx-bootstrap/accordion';
//
// //TODO: at xs view-widths, make each section an Accordion to minimize mobile scrolling
// export function getAccordionConfig(): AccordionConfig {
//     return Object.assign(new AccordionConfig(), { closeOthers: true});
// }
//
// @Component({
//     selector: 'app-footer',
//     templateUrl: './footer.html',
//     styleUrls: ['./footer.scss'],
//     providers: [{ provide: AccordionConfig, useFactory: getAccordionConfig }],
// })
//
//
// export class FooterComponent implements OnInit, OnDestroy{
//     Router;
//     isOrgAdmin; //TODO: check for this
//     isAdmin;
//     isLoggedIn;
//     currentUser = {};
//     AuthService;
//     oneAtATime = true;
//     isCollapsed = true;
//
//
//     static parameters = [AuthService, Router, OrganizationService, HttpClient];
//
//     constructor(public authService: AuthService, public router: Router, public http: HttpClient ) {
//         this.AuthService = authService;
//         this.Router = router;
//
//         this.reset();
//
//         this.AuthService.currentUserChanged.subscribe(user => {
//             this.currentUser = user;
//             this.reset();
//         });
//     }
//
//     ngOnInit(): void {
//     }
//
//     ngOnDestroy(): void {}
//
//     reset() {
//         this.AuthService.isLoggedIn().then(is => {
//             this.isLoggedIn = is;
//         });
//         this.AuthService.isAdmin().then(is => {
//             this.isAdmin = is;
//         });
//         //TODO: make this method in AuthService
//         // this.AuthService.isOrgAdmin().then(is => {
//         //     this.isOrgAdmin = is;
//         // });
//         this.AuthService.getCurrentUser().then(user => {
//             this.currentUser = user;
//         });
//     }
//
//     logout() {
//         return this.AuthService.logout().then(() => {
//             this.Router.navigateByUrl('/home');
//             this.reset();
//         });
//     }
// }
