import ExpoModulesCore

public class IronfishNativeModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('IronfishNativeModule')` in JavaScript.
    Name("IronfishNativeModule")

    AsyncFunction("rustAdd") { (a: Int32, b: Int32) -> Int32 in
      return rustAdd(left: a, right: b)
    }
  }
}
