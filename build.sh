node_modules/babel-cli/bin/babel.js src/js/mainApp.js --out-dir dist --source-maps --presets env
browserify dist/src/js/mainApp.js -o public/js/app.js