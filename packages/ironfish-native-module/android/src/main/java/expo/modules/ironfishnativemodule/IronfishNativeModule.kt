package expo.modules.ironfishnativemodule

import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Record

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

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

class ExpoOutput(
  @Field
  val index: Int,

  @Field
  val note: String,
 ) : Record

class SpendComponentsInput(
  @Field
  val components: List<SpendComponentInput>,
 ) : Record

class SpendComponentInput(
  @Field
  val note: String,

  @Field
  val witnessRootHash: String,

  @Field
  val witnessTreeSize: String,

  @Field
  val witnessAuthPath: List<WitnessNodeInput>,
) : Record

class WitnessNodeInput (
  @Field
  val side: String,

  @Field
  val hashOfSibling: String,
): Record

class OutputsInput (
  @Field
  val outputs: List<String>,
): Record

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

    Function("generatePublicAddressFromIncomingViewKey") { incomingViewKey: String ->
      uniffi.rust_lib.generatePublicAddressFromIncomingViewKey(incomingViewKey)
    }

    Function("isValidPublicAddress") { hexAddress: String ->
      uniffi.rust_lib.isValidPublicAddress(hexAddress)
    }

    AsyncFunction("unpackGzip") { gzipPath: String, outputPath: String ->
      uniffi.rust_lib.unpackGzip(gzipPath, outputPath)
    }

    AsyncFunction("readPartialFile") { path: String, offset: Long, length: Long ->
        uniffi.rust_lib.readPartialFile(path, offset.toUInt(), length.toUInt())
    }

    AsyncFunction("decryptNotesForOwner") { noteEncrypteds: List<String>, incomingHexKey: String, promise: Promise ->
      CoroutineScope(Dispatchers.Default).launch {
        try {
          val decryptedNotes = uniffi.rust_lib.decryptNotesForOwner(noteEncrypteds, incomingHexKey)
          val expoOutputs = decryptedNotes.map { note ->
              ExpoOutput(index = note.index.toInt(), note = (note.note))
          }
          promise.resolve(expoOutputs)
        } catch (e: Exception) {
          promise.reject(CodedException(e))
        }
      }
    }

    AsyncFunction("decryptNotesForSpender") { noteEncrypteds: List<String>, outgoingHexKey: String, promise: Promise ->
      CoroutineScope(Dispatchers.Default).launch {
        try {
            val decryptedNotes = uniffi.rust_lib.decryptNotesForSpender(noteEncrypteds, outgoingHexKey)
            val expoOutputs = decryptedNotes.map { note ->
                ExpoOutput(index = note.index.toInt(), note = note.note)
            }
          promise.resolve(expoOutputs)
        } catch (e: Exception) {
          promise.reject(CodedException(e))
        }
      }
    }

    AsyncFunction("nullifier") { note: String, position: String, viewKey: String ->
      uniffi.rust_lib.nullifier(note, position, viewKey)
    }

    AsyncFunction("createNote") { owner: ByteArray, value: String, memo: ByteArray, assetId: ByteArray, sender: ByteArray ->
      try {
          uniffi.rust_lib.createNote(uniffi.rust_lib.NoteParams(owner, value.toULong(), memo, assetId, sender))
      } catch (e: Exception) {
          println("Unexpected error: ${e.message}")
          throw e
      }
    }

    AsyncFunction("createTransaction") { transactionVersion: Int, transactionFee: String, expirationSequence: Int, spendComponents: SpendComponentsInput, outputs: OutputsInput, spendingKey: ByteArray ->
      val spendComponentsConverted = spendComponents.components.map { spendComponent ->
        val witnessAuthPath = spendComponent.witnessAuthPath.map { uniffi.rust_lib.WitnessNode(it.side, it.hashOfSibling.hexStringToByteArray()) }
        uniffi.rust_lib.SpendComponents(spendComponent.note.hexStringToByteArray(), spendComponent.witnessRootHash.hexStringToByteArray(), spendComponent.witnessTreeSize.toULong(), witnessAuthPath)
      }
      try {
        val transaction = uniffi.rust_lib.createTransaction(transactionVersion.toUByte(), transactionFee.toULong(), expirationSequence.toUInt(), spendComponentsConverted, outputs.outputs.map { it.hexStringToByteArray() }, spendingKey)
        transaction
      } catch (e: Exception) {
        println("Unexpected error: ${e.message}")
        throw e
      }
    }

    AsyncFunction("hashTransaction") { transaction: ByteArray ->
      uniffi.rust_lib.hashTransaction(transaction)
    }
  }
}

fun String.hexStringToByteArray(): ByteArray {
    val len = this.length
    require(len % 2 == 0) { "Hex string must have an even length" }

    return ByteArray(len / 2) { i ->
        val index = i * 2
        ((this[index].digitToInt(16) shl 4) + this[index + 1].digitToInt(16)).toByte()
    }
}
