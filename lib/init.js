'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function () {

    const folders = [
        path.resolve(process.cwd(), '_parts'),
        path.resolve(process.cwd(), '_posts'),
        path.resolve(process.cwd(), '_styles'),
        path.resolve(process.cwd(), '_scripts'),
        path.resolve(process.cwd(), 'pages'),
        path.resolve(process.cwd(), 'styles'),
    ];

    folders.forEach(folder => {
        try {
            fs.mkdirSync(folder);
        } catch (ex) {
        }
    });
}
