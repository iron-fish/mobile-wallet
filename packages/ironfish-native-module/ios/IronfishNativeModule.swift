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

struct ExpoOutput : Record {
  @Field
  var index: UInt32 = 0

  @Field
  var note: String
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

    Function("spendingKeyToWords") { (privateKey: String, languageCode: Int32) throws -> String in
      let phrase = try spendingKeyToWords(privateKey: privateKey, languageCode: languageCode)
      return phrase
    }

    Function("wordsToSpendingKey") { (words: String, languageCode: Int32) throws -> String? in
      guard let k = try? wordsToSpendingKey(words: words, languageCode: languageCode) else {
        return nil
      }

      return k
    }

    Function("generateKeyFromPrivateKey") { (privateKey: String) throws -> ExpoKey? in
      guard let k = try? generateKeyFromPrivateKey(privateKey: privateKey) else {
        return nil
      }

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

    AsyncFunction("unpackGzip") { (gzipPath: String, outputPath: String) -> Bool in
      return unpackGzip(gzipPath: gzipPath, outputPath: outputPath)
    }

    AsyncFunction("readPartialFile") { (path: String, offset: UInt32, length: UInt32) -> Data in
      return readPartialFile(path: path, offset: offset, length: length)
    }

    AsyncFunction("decryptNotesForOwner") { (noteEncrypteds: [String], incomingHexKey: String, promise: Promise) in
      Task {
        let decryptedNotes = try await decryptNotesForOwner(noteEncrypteds: noteEncrypteds, incomingHexKey: incomingHexKey)
        let expoOutputs = decryptedNotes.map { note in
          ExpoOutput(index: note.index, note: Field(wrappedValue: note.note))
        }
        promise.resolve(expoOutputs)
      }
    }

    AsyncFunction("decryptNotesForSpender") { (noteEncrypteds: [String], outgoingHexKey: String, promise: Promise) in
      Task {
        let decryptedNotes = try await decryptNotesForSpender(noteEncrypteds: noteEncrypteds, outgoingHexKey: outgoingHexKey)
        let expoOutputs = decryptedNotes.map { note in
          ExpoOutput(index: note.index, note: Field(wrappedValue: note.note))
        }
        promise.resolve(expoOutputs)
      }
    }

    AsyncFunction("nullifier") { (note: String, position: String, viewKey: String) throws -> String in
      return try nullifier(note: note, position: position, viewKey: viewKey)
    }
  }
}
