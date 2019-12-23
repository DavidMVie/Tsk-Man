const path = require('path');

const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public/scripts')
  },
  module: {
    rules: [{
      test: /\.hbs$/, 
      loader: "handlebars-loader",
      options: {
        helperDirs: [path.resolve(__dirname, 'src/templates/helpers')],
      }
     }]
  },
  plugins: [
  // To strip all locales except “en”
  new MomentLocalesPlugin()
],
  devtool: 'source-map'
}
