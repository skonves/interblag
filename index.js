#!/usr/bin/env node

switch (process.argv[2]) {
        case 'init':
                require('./lib/init')();
                break;
        case 'build':
                require('./lib/builder')();
                break;
        case 'serve':
                require('./lib/server')(process.argv[3]);
                break;
}