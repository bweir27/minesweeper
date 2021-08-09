import 'reflect-metadata';
import './app.scss';
import './polyfills';

import { enableProdMode } from '@angular/core';
import { platformBrowser } from '@angular/platform-browser';

enableProdMode();

import { AppModule } from './app.module';

export function main() {
    return platformBrowser().bootstrapModule(AppModule);
}

if (document.readyState === 'complete') {
    main();
} else {
    document.addEventListener('DOMContentLoaded', main);
}
