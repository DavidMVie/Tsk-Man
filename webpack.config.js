const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public/scripts')
  },
  module: {
    rules: [{test: /\.hbs$/, loader: "handlebars-loader" }]
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'public'),
    publicPath: '/scripts'
  },
  devtool: 'source-map'
}