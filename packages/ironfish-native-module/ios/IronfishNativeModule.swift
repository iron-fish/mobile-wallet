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

struct SpendComponentsInput: Record {
  @Field
  var components: [SpendComponentInput]
}

struct SpendComponentInput: Record {
  @Field
  var note: String

  @Field
  var witnessRootHash: String

  @Field
  var witnessTreeSize: String

  @Field
  var witnessAuthPath: [WitnessNodeInput]
}

struct WitnessNodeInput: Record {
  @Field
  var side: String

  @Field
  var hashOfSibling: String
}

struct OutputsInput: Record {
  @Field
  var outputs: [String]
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

    AsyncFunction ("createNote") { (owner: Data, value: String, memo: Data, assetId: Data, sender: Data) throws -> Data in
      do {
          let note = try createNote(params: NoteParams(owner: owner, value: UInt64(value)!, memo: memo, assetId: assetId, sender: sender))
          return note
      } catch let error as NSError {
          print("Unexpected error: \(error.debugDescription)")
          throw error
      }
    }

    AsyncFunction("createTransaction") { (transactionVersion: UInt8, transactionFee: String, expirationSequence: UInt32, spendComponents: SpendComponentsInput, outputs: OutputsInput, spendingKey: Data) throws  -> Data in
      let spendComponentsConverted = spendComponents.components.map { spendComponent in
          let witnessAuthPath: [WitnessNode] = spendComponent.witnessAuthPath.map { WitnessNode(side: $0.side, hashOfSibling: Data(hexString: $0.hashOfSibling)!) }
          return SpendComponents(note: Data(hexString: spendComponent.note)!, witnessRootHash: Data(hexString: spendComponent.witnessRootHash)!, witnessTreeSize: UInt64(spendComponent.witnessTreeSize)!, witnessAuthPath: witnessAuthPath)
      }
      do {
        let transaction = try createTransaction(transactionVersion: transactionVersion, transactionFee: UInt64(transactionFee)!, expirationSequence: expirationSequence, spendComponents: spendComponentsConverted, outputs: outputs.outputs.map {Data(hexString: $0)!}, spendingKey: spendingKey)
          return transaction
      } catch let error as NSError {
          print("Unexpected error: \(error.debugDescription)")
          throw error
      }
    }
  }
}

extension Data {
    init?(hexString: String) {
        let length = hexString.count / 2
        var data = Data(capacity: length)
        for i in 0..<length {
            let j = hexString.index(hexString.startIndex, offsetBy: i*2)
            let k = hexString.index(j, offsetBy: 2)
            let bytes = hexString[j..<k]
            if var num = UInt8(bytes, radix: 16) {
                data.append(&num, count: 1)
            } else {
                return nil
            }
        }
        self = data
    }
}
