const webpack = require('webpack')
const path = require('path')

module.exports = {
	entry: './client/main.js',
	node: { 
		fs: 'empty' 
	},
	output: {
		filename: 'app.js',
		path: path.resolve(__dirname, 'public/js')
	},
	module: {
		loaders: [{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader'
		}]
	},
	plugins: [
    	//new webpack.optimize.UglifyJsPlugin()
	]
}