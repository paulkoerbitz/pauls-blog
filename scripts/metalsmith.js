const Metalsmith = require('metalsmith');
const markdown = require('metalsmith-markdown');
const layouts = require('metalsmith-layouts');
const assets = require('metalsmith-static');
const permalinks = require('metalsmith-permalinks');
const collections = require('metalsmith-collections');
const helpers = require('metalsmith-register-helpers');
const codeHighlight = require('metalsmith-code-highlight');
// var paths = require('metalsmith-paths');
// var partials = require('metalsmith-discover-partials');

const fixLayout = layouts => files => {
    for (const file in files) {
        for (const [layoutRegex, layout] of layouts) {
            if (files[file].layout == undefined && layoutRegex.test(file)) {
                files[file].layout = layout;
            }
        }
    }
    return files;
};

const removeDrafts = files => {
    for (const file in files) {
        if (files[file].draft) {
            delete files[file];
        }
    }
    return files;
}

const ms = Metalsmith(__dirname)
    .source('../src/')
    .destination('../build')
    // .use(paths())
    .use(helpers({
        directory: './hbs-helpers'
    }))
    .use(fixLayout([
        [/^posts\/.*/, 'post.html'],
        [/^notes\/.*/, 'post.html']
    ]))
    .use(removeDrafts)
    .use(markdown())
    .use(codeHighlight())
    .use(collections({          // group all blog posts by internally
        posts: {
            pattern: '*posts/*',
            order: 'date',
            reverse: true,
        },
        lastPosts: {
            pattern: '*posts/*',
            order: 'date',
            reverse: true,
            limit: 10
        },
        notes: {
            pattern: '*notes/*',
            order: 'date',
            reverse: true,
        },
    }))
    .use(layouts({
        engine: 'handlebars',
        directory: '../layouts',
        partials: '../layouts'
    }))
    .use(assets({
        src: '../assets',
        dest: '../build/assets'
    }))
    .use(assets({
        src: '../images',
        dest: '../build/images'
    }))
    .use(assets({
        src: '../css',
        dest: '../build/css'
    }))
    // .use(permalinks())
    ;/*
    .use(files => {
        console.log(files);
    });*/

exports.ms = ms;

//   .use(collections({
//       home: {
//         pattern: 'index.md',
//         metadata: {
//           name: "Home"
//         }
//       },
//       installation: {
//         pattern: 'install/*.md',
//         sortBy: 'order',
//         metadata: {
//           name: "Installation"
//         }
//       },
//       guide: {
//         pattern: 'guide/*.md',
//         sortBy: 'order',
//         metadata: {
//           name: "Guide"
//         }
//       },
// 	  development: {
//         pattern: 'development/*.md',
//         sortBy: 'order',
//         metadata: {
//           name: "Development"
//         }
//       },
//       api: {
//         pattern: 'api/*.md',
//         sortBy: 'order',
//         metadata: {
//           name: "API"
//         }
//       }
//     }))
//   .use(assets({
//     src: '../public/components/bootstrap/dist',
//     dest: '../build/assets/bootstrap'
//   }))
//   .use(assets({
//     src: '../public/components/jquery/dist',
//     dest: '../build/assets/jquery'
//   }))

