const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';
  // In Dev: relativer Pfad /api → wird vom webpack Proxy an localhost:3002 weitergeleitet
  // In Prod: absolute URL zur API
  const apiUrl = isDev
    ? '/api'
    : (process.env.API_URL || 'https://signatures.guschlbauer.cc/api');

  return {
    entry: {
      taskpane: './src/taskpane/taskpane.tsx',
      commands: './src/commands/commands.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@guschlbauer/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              allowTsInNodeModules: true,
              transpileOnly: true,
            },
          },
          exclude: /node_modules\/(?!@guschlbauer)/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.API_URL': JSON.stringify(apiUrl),
      }),
      new HtmlWebpackPlugin({
        template: './src/taskpane/taskpane.html',
        filename: 'taskpane.html',
        chunks: ['taskpane'],
      }),
      new HtmlWebpackPlugin({
        template: './src/commands/commands.html',
        filename: 'commands.html',
        chunks: ['commands'],
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'assets', to: 'assets' },
          { from: 'manifest.xml', to: 'manifest.xml' },
          { from: 'manifest.json', to: 'manifest.json' },
        ],
      }),
    ],
    devServer: {
      port: 3100,
      server: 'https',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      allowedHosts: 'all',
      proxy: [
        {
          context: ['/api'],
          target: 'https://localhost:3002',
          secure: false, // Selbstsignierte Zertifikate akzeptieren
          changeOrigin: true,
        },
      ],
    },
    devtool: isDev ? 'source-map' : false,
  };
};
