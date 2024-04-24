package expo.modules.ironfishnativemodule

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Record

class ExpoKey(
  @Field
  val spendingKey: String,
  @Field
  val viewKey: String,
  @Field
  val incomingViewKey: String,
  @Field
  val outgoingViewKey: String,
  @Field
  val publicAddress: String,
  @Field
  val proofAuthorizingKey: String
) : Record

class IronfishNativeModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('IronfishNativeModule')` in JavaScript.
    Name("IronfishNativeModule")

    Function("generateKey") { ->
      val k = uniffi.rust_lib.generateKey()

      ExpoKey(
        k.spendingKey,
        k.viewKey,
        k.incomingViewKey,
        k.outgoingViewKey,
        k.publicAddress,
        k.proofAuthorizingKey
      )
    }

    Function("spendingKeyToWords") { privateKey: String, languageCode: Int ->
      uniffi.rust_lib.spendingKeyToWords(privateKey, languageCode)
    }

    Function("wordsToSpendingKey") { words: String, languageCode: Int ->
      uniffi.rust_lib.wordsToSpendingKey(words, languageCode)
    }

    Function("generateKeyFromPrivateKey") { privateKey: String ->
      val k = uniffi.rust_lib.generateKeyFromPrivateKey(privateKey)

      ExpoKey(
        k.spendingKey,
        k.viewKey,
        k.incomingViewKey,
        k.outgoingViewKey,
        k.publicAddress,
        k.proofAuthorizingKey
      )
    }

    Function("isValidPublicAddress") { hexAddress: String ->
      try {
        uniffi.rust_lib.isValidPublicAddress(hexAddress)
      } catch (error: Exception) {
        error.printStackTrace()
        throw error
      }
    }
  }
}
