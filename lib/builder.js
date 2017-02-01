'use strict';

const path = require('path');
const marked = require('marked');
const fs = require('fs');
const recursive = require('recursive-readdir');
const os = require('os');
const minify = require('html-minifier').minify;
const hljs = require('highlight.js');
const fsSync = require('fs-sync');

let styles = [];

module.exports = function () {
    const cwd = process.cwd();

    const postsInput = path.resolve(cwd, '_posts');
    const partsInput = path.resolve(cwd, '_parts');
    const stylesInput = path.resolve(cwd, '_styles');
    const scriptsInput = path.resolve(cwd, '_scripts');

    const postsOutput = path.resolve(cwd, 'pages');
    const stylesOutput = path.resolve(cwd, 'styles');

    try {
        fs.mkdirSync(postsOutput);
    } catch (ex) {
    }
    try {
        fs.mkdirSync(stylesOutput);
    } catch (ex) {
    }

    recursive(stylesInput, (err, styleFiles) => {
        if (err) {
            console.error(err);
        } else {
            styleFiles.forEach(file => {
                const toFile = path.resolve(stylesOutput, path.parse(file).base);
                fsSync.copy(file, toFile, { force: true });
                styles.push(path.parse(file).base);
            });
        }
    });

    const postsDir = postsInput;
    const stylesDir = stylesInput
    const pagesDir = postsOutput

    recursive(postsDir, (err, postFiles) => {
        if (err) {
            console.error(err);
        } else {
            let scripts = [];
            recursive(scriptsInput, (err, scriptFiles) => {
                if (err) {
                    console.error(err);
                } else {
                    scriptFiles.forEach(file => {
                        const js = fs.readFileSync(file, 'utf8');
                        scripts.push(js);
                    });

                    const articles = postFiles.map(file => {
                        return getArticle(file);
                    }).filter(article => {
                        return article;
                    }).sort(function (a, b) {
                        a = new Date(a.date);
                        b = new Date(b.date);
                        return a > b ? -1 : a < b ? 1 : 0;
                    });

                    articles.forEach(article => {
                        let html = getPage(article, articles, scripts);
                        fs.writeFileSync(path.resolve(cwd, 'pages', article.slug + '.html'), html, { encoding: 'utf8' });
                    });

                    let mainArticle = getMainArticle(articles);
                    let homepage = getPage(mainArticle, articles, scripts);
                    fs.writeFileSync(path.resolve(cwd, 'index.html'), homepage, { encoding: 'utf8' });

                    console.log(`Built ${articles.length} pages`);
                }
            });
        }
    });
}

function getPart(name) {
    const filename = path.resolve(process.cwd(), '_parts', name + '.md');
    try {
        const markdown = fs.readFileSync(filename, { encoding: 'utf8' });

        return marked(markdown);

    } catch (ex) {
        return 'missing file: ' + filename;
    }
}

function getArticle(filepath) {
    const file = path.parse(filepath);
    const parts = /^([0-9]{4})-([0-9]{2})-([0-9]{2})-(.*)$/.exec(file.name);

    if (parts) {
        const date = new Date(Number(parts[1]), Number(parts[2]), Number(parts[3]));
        const markdown = fs.readFileSync(filepath, { encoding: 'utf8' });
        const title = getTitle(markdown);
        const slug = parts[4];

        return new Article(title, slug, date, markdown);
    }
}

function getMainArticle(allArticles) {
    return allArticles[0];
}

function copyStyleFiles(styleFiles) {

}

function getPage(article, allArticles, scripts) {
    return minify(`
<!DOCTYPE html>
<html>
${getHead(article, scripts)}
<body>
${getHeader(article)}
<section id="main">
${getBody(article)}
${getNav(allArticles)}
</section>
${getFooter(article)}
</body>
</html>`, {
            collapseWhitespace: true
        });
}

function getTitle(markdown) {
    let renderer = new marked.Renderer();

    var h = [];

    renderer.heading = function (text, level) {
        h[level] = h[level] || text;
    }

    marked(markdown, { renderer });

    return h[1] || h[2] || h[3] || h[4] || h[5] || h[6] || 'Title';
}

function getStyleSheets() {

}

function getHead(article, scripts) {
    var x = styles.map(style => {
        return `<link href="/styles/${style}" rel="stylesheet">`;
    });

    return `
        <head>
            <title>${article.title}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            ${x.join(os.EOL)}
            ${getScripts(scripts)}
        </head>`;
}

function getHeader(article) {
    return `<header>${getPart('header')}</header>`;
}

function getFooter(article) {
    return `<footer>${getPart('footer')}</footer>`;
}

function getBody(article) {
    let renderer = new marked.Renderer();

    renderer.code = function (code, language) {
        if (language) {
            var html = hljs.highlight(language, code).value;
            return `<pre class="hljs"><code>${html}</code></pre>`;
        } else {
            return `<code>${code}</code>`;
        }
    }

    return `<article>${marked(article.markdown, { renderer })}</article>`;
}

function getNav(articles) {
    var x = articles.map(article => {
        return `<li><a href="/pages/${article.slug}.html">${article.title}</a></li>`;
    })

    return `
        <nav>
            <div id="navtop">${getPart('navtop')}</div>
            <ul>${x.join(os.EOL)}</ul>
            <div id="navbottom">${getPart('navbottom')}</div>
        </nav>`;
}

function getScripts(scripts) {
    let html = '';

    scripts.forEach(script => {
        html += `<script>${script}</script>`;
    });

    return html;
}

function Article(title, slug, date, markdown) {
    this.title = title;
    this.slug = slug;
    this.date = date;
    this.markdown = markdown;
}