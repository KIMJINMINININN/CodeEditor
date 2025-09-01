const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const WebpackBar = require("webpackbar");

module.exports = {
  entry: "./src/main.tsx",
  mode: process.env.NODE_ENV ?? "development",
  devtool: "source-map",
  devServer: {
    port: 5173,
    open: true,
    historyApiFallback: true,
    static: { directory: path.join(__dirname, "public") },
  },

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@app": path.resolve(__dirname, "src/app"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@widgets": path.resolve(__dirname, "src/widgets"),
      "@features": path.resolve(__dirname, "src/features"),
      "@entities": path.resolve(__dirname, "src/entities"),
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      { test: /\.(png|jpg|gif|svg)$/, type: "asset" },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"),
      filename: "index.html",
    }),
    new MonacoWebpackPlugin({
      languages: [
        "javascript",
        "typescript",
        "json",
        "markdown",
        "css",
        "html",
      ],
      features: ["!gotoSymbol"],
    }),
    new WebpackBar({
      name: "Main",
      color: "cyan",
      basic: true,
      profile: true,
    }),

    new BundleAnalyzerPlugin({
      analyzerMode: "static", // HTML 보고서 생성
      openAnalyzer: false, // 자동으로 브라우저 오픈 안 함
      reportFilename: "bundle-report.html",
    }),
  ],
  output: {
    filename: "bundle.[contenthash].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
};
