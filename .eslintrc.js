// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  ignorePatterns: ["webpack.*.js", "i18next-scanner.config.js", "scripts/**/*"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  settings: {
    react: {
      version: "detect", // 설치된 React 버전을 자동으로 감지
    },
    "import/resolver": {
      typescript: {},
      alias: {
        map: [["@", "./src"]],
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  plugins: ["react", "@typescript-eslint"],
  rules: {
    "react/jsx-filename-extension": [
      "warn",
      { extensions: [".tsx"] }, // tsx 허용
    ],
    "no-use-before-define": "off", // 호이스팅 허용
    "react/jsx-props-no-spreading": "off", // props 전개 연산자 허용
    "no-shadow": "off", // 동일 변수 네이밍 허용
    "react/jsx-no-bind": "off", // function props 오류 해제
    "no-underscore-dangle": "off", // 변수명 _ 허용
    camelcase: [
      "error",
      {
        properties: "never",
        ignoreDestructuring: false,
      },
    ],
    "consistent-return": "warn", // 함수 반환 값 통일 권고
    "react/react-in-jsx-scope": "off", // React 17+ 자동 JSX Transform
    eqeqeq: "warn", // == 사용 경고
  },
};
