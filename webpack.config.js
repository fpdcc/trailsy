var webpack = require("webpack");
module.exports = {
    entry: "./js/app.js",
    output: {
        path: __dirname,
        sourceMapFilename: "bundle.js.map",
        filename: "bundle.js"
    },
    devtool: 'source-map',
    plugins: [
        new webpack.ProvidePlugin({
           $: "jquery",
           jQuery: "jquery"
       })
    ]
};
