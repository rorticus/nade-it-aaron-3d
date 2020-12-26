const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: {
        main: ['./src/index.ts']
    },
    mode: 'development',
    plugins: [
        new HtmlWebpackPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader'
            },
            {
                test: /data.*\.png$/,
                use: 'raw-loader'
            },
            {
                test: /\.fnt$/,
                use: [
                    {
                        loader: 'raw-loader',
                        options: {
                            esModule: false
                        }
                    }
                ]
            },
            {
                test: /^(?!.*data).*(\.png|\.jpg)$/,
                use: 'file-loader'
            },
            {
                test: /\.(glb|mp3)$/,
                use: 'arraybuffer-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'build')
    }
};
