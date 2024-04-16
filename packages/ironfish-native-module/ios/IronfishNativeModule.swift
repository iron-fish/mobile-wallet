import ExpoModulesCore

struct ExpoKey: Record {
  @Field
  var spendingKey: String

  @Field
  var viewKey: String

  @Field
  var incomingViewKey: String

  @Field
  var outgoingViewKey: String

  @Field
  var publicAddress: String

  @Field
  var proofAuthorizingKey: String
}

public class IronfishNativeModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('IronfishNativeModule')` in JavaScript.
    Name("IronfishNativeModule")

    Function("generateKey") { () -> ExpoKey in
      let k = generateKey()

      return ExpoKey(
        spendingKey: Field(wrappedValue: k.spendingKey),
        viewKey: Field(wrappedValue: k.viewKey),
        incomingViewKey: Field(wrappedValue: k.incomingViewKey),
        outgoingViewKey: Field(wrappedValue: k.outgoingViewKey),
        publicAddress: Field(wrappedValue: k.publicAddress),
        proofAuthorizingKey: Field(wrappedValue: k.proofAuthorizingKey)
      )
    }

    Function("wordsToSpendingKey") { (words: String, languageCode: Int32) throws -> String in
      let k = try wordsToSpendingKey(words: words, languageCode: languageCode)
      return k
    }

    Function("generateKeyFromPrivateKey") { (privateKey: String) throws -> ExpoKey in
      let k = try generateKeyFromPrivateKey(privateKey: privateKey)

      return ExpoKey(
        spendingKey: Field(wrappedValue: k.spendingKey),
        viewKey: Field(wrappedValue: k.viewKey),
        incomingViewKey: Field(wrappedValue: k.incomingViewKey),
        outgoingViewKey: Field(wrappedValue: k.outgoingViewKey),
        publicAddress: Field(wrappedValue: k.publicAddress),
        proofAuthorizingKey: Field(wrappedValue: k.proofAuthorizingKey)
      )
    }

    Function("isValidPublicAddress") { (hexAddress: String) -> Bool in
      return isValidPublicAddress(hexAddress: hexAddress)
    }
  }
}
