var path = require("path")

module.exports = {
    mode: "production",
    entry: {
        app: "./src/app.js"
    },
    output: {
        path : path.resolve("dis"),
        filename: "app.bundle.3d.js",
        libraryTarget: 'var',
        library: "threeD"
    },

    module: {
        rules: [{
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env']
                }
            }
        }]
    }
}