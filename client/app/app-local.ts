import 'reflect-metadata';
import './app.scss';
import './polyfills';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ɵresetCompiledComponents } from '@angular/core';

import { AppModule } from './app.module';

export function main() {
    return platformBrowserDynamic().bootstrapModule(AppModule)
        .then((ngModuleRef: any) => {
            if (module['hot']) {
                module['hot'].accept();
                module['hot'].dispose(() => ɵresetCompiledComponents());
            }
            return ngModuleRef;
        });
}

if (document.readyState === 'complete') {
    main();
} else {
    document.addEventListener('DOMContentLoaded', main);
}
