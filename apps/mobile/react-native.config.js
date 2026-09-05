// 显式覆盖 `expo` 包的 RN autolinking 配置。
//
// 背景：expo 包的 Android Gradle namespace 是遗留的 `expo.core`，但实际的
// `ExpoModulesPackage` 类位于 `expo.modules` 包（见 expo 包内
// android/src/main/java/expo/modules/ExpoModulesPackage.kt）。
//
// 在 EAS 云端构建中，RN autolinking 可能读不到 expo 自带的
// react-native.config.js（它依赖 process.cwd() 探测项目根），从而回退到
// namespace `expo.core` 推导类名，生成错误的
// `import expo.core.ExpoModulesPackage;`，导致
// ":app:compileReleaseJavaWithJavac" 编译失败（cannot find symbol）。
//
// 这里用静态配置强制指向正确路径，避免依赖运行时项目根探测。
module.exports = {
  dependencies: {
    expo: {
      platforms: {
        android: {
          packageImportPath: 'import expo.modules.ExpoModulesPackage;',
          packageInstance: 'new ExpoModulesPackage()',
        },
      },
    },
  },
};
