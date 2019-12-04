const path = require('path');

const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public/scripts')
  },
  module: {
    rules: [{test: /\.hbs$/, loader: "handlebars-loader" }]
  },
  plugins: [
  // To strip all locales except “en”
  new MomentLocalesPlugin()
], 
  devServer: {
    contentBase: path.resolve(__dirname, 'public'),
    publicPath: '/scripts'
  },
  devtool: 'source-map'
}

