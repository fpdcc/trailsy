var webpack = require("webpack");
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
    plugins: [
        new webpack.ProvidePlugin({
           $: "jquery",
           jQuery: "jquery"
       }),
       new webpack.DefinePlugin({
        __DEV__: true
    })//,
    //    new webpack.ProvidePlugin({
    //         'process.env': {
    //             NODE_ENV: JSON.stringify(dev) // Or some other check
    //         },
    //         __DEV__: JSON.stringify(true) // or something
    //     })
    ]
};
