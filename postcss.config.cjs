// postcss.config.cjs
module.exports = {
  plugins: {
    autoprefixer: {},
    'postcss-px-to-viewport-8-plugin': {
      viewportWidth: 375, // 设计稿宽度
      unitPrecision: 5,
      viewportUnit: 'vw',
      selectorBlackList: ['.ignore', '.hairline', '.keep-px'], // 不转换的类（在组件/父容器上挂 .keep-px 即保留 px）
      minPixelValue: 1, // 小于等于 1px 不转（常用于边框）
      mediaQuery: false,
      // 这个插件没有 include 选项，只能用 exclude。用负向前瞻，排除所有非 h5 的文件。
      exclude: [/node_modules/, /src\/(?!modules\/h5)/],
    },
  },
};
