var webpack = require("webpack");

// Uses uglifyJSPlugin settings from --optimize-minimize
// (https://webpack.js.org/guides/production-build/#minification)
// but with an option in `compress` turned off. The `comparisons` option will
// mangle a check for `"undefined"!==typeof module&&module.exports` to
// `void 0!==e&&e.exports` which causes the browser to report `e` is undefined.

const pluginsList = [
    new webpack.ProvidePlugin({
       $: "jquery",
       jQuery: "jquery"
   })]

module.exports = {
    entry: "./js/app.js",
    output: {
        path: __dirname,
        sourceMapFilename: "bundle.js.map",
        filename: "bundle.js"
    },
    module: {
        noParse: /tangram\/dist\/tangram/
    },
    devtool: 'source-map',
    plugins: pluginsList
    // plugins: [
    //     new webpack.ProvidePlugin({
    //        $: "jquery",
    //        jQuery: "jquery"
    //    }),
       
    // ]
};
