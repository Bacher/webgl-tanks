const webpack = require('webpack');

module.exports = {
    plugins: process.env.NODE_ENV === 'production' ? [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"',
            }
        }),
        new webpack.optimize.UglifyJsPlugin()
    ] : null,
    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
        ],
    },
};
