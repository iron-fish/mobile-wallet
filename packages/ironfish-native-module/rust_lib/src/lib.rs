extern crate num;
#[macro_use]
extern crate num_derive;

use std::{
    cmp,
    fs::{self, File},
    io::{Cursor, Read, Seek, SeekFrom},
};
use tokio_rayon::rayon::iter::{
    IndexedParallelIterator, IntoParallelRefIterator, ParallelIterator,
};
use zune_inflate::DeflateDecoder;

use crate::num::FromPrimitive;
use ironfish::sapling_bls12::Scalar;
use ironfish::{
    assets::asset::ID_LENGTH, keys::Language, note::MEMO_SIZE, serializing::bytes_to_hex,
    MerkleNoteHash, Note, PublicAddress, SaplingKey,
};

uniffi::setup_scaffolding!();

#[derive(thiserror::Error, uniffi::Error, Debug)]
pub enum EnumError {
    #[error("Error: {msg}")]
    Error { msg: String },
}

#[derive(FromPrimitive)]
pub enum LanguageCode {
    English,
    ChineseSimplified,
    ChineseTraditional,
    French,
    Italian,
    Japanese,
    Korean,
    Spanish,
}

impl From<LanguageCode> for Language {
    fn from(item: LanguageCode) -> Self {
        match item {
            LanguageCode::English => Language::English,
            LanguageCode::ChineseSimplified => Language::ChineseSimplified,
            LanguageCode::ChineseTraditional => Language::ChineseTraditional,
            LanguageCode::French => Language::French,
            LanguageCode::Italian => Language::Italian,
            LanguageCode::Japanese => Language::Japanese,
            LanguageCode::Korean => Language::Korean,
            LanguageCode::Spanish => Language::Spanish,
        }
    }
}

#[derive(uniffi::Record)]
pub struct Key {
    pub spending_key: String,
    pub view_key: String,
    pub incoming_view_key: String,
    pub outgoing_view_key: String,
    pub public_address: String,
    pub proof_authorizing_key: String,
}

#[derive(uniffi::Record)]
pub struct DecryptedNote {
    pub index: u32,
    pub note: String,
}

#[derive(uniffi::Record)]
pub struct WitnessNode {
    pub side: String,
    pub hash_of_sibling: Vec<u8>,
}

#[derive(uniffi::Record)]
pub struct SpendComponents {
    pub note: Vec<u8>,
    pub witness_root_hash: Vec<u8>,
    pub witness_tree_size: u64,
    pub witness_auth_path: Vec<WitnessNode>,
}

#[derive(uniffi::Record)]
pub struct NoteParams {
    owner: Vec<u8>,
    value: u64,
    memo: Vec<u8>,
    asset_id: Vec<u8>,
    sender: Vec<u8>,
}

#[uniffi::export]
fn generate_key() -> Key {
    let sapling_key: SaplingKey = SaplingKey::generate_key();

    Key {
        spending_key: sapling_key.hex_spending_key(),
        view_key: sapling_key.view_key().hex_key(),
        incoming_view_key: sapling_key.incoming_view_key().hex_key(),
        outgoing_view_key: sapling_key.outgoing_view_key().hex_key(),
        public_address: sapling_key.public_address().hex_public_address(),
        proof_authorizing_key: bytes_to_hex(
            &sapling_key.sapling_proof_generation_key().nsk.to_bytes(),
        ),
    }
}

#[uniffi::export]
pub fn spending_key_to_words(private_key: String, language_code: i32) -> Result<String, EnumError> {
    let key =
        SaplingKey::from_hex(&private_key).map_err(|e| EnumError::Error { msg: e.to_string() })?;
    let language_code_enum: LanguageCode =
        LanguageCode::from_i32(language_code).ok_or_else(|| EnumError::Error {
            msg: "Invalid language code".to_string(),
        })?;
    let language = Language::from(language_code_enum);

    let mnemonic = key
        .to_words(language)
        .map_err(|e| EnumError::Error { msg: e.to_string() })?;
    Ok(mnemonic.into_phrase())
}

#[uniffi::export]
pub fn words_to_spending_key(words: String, language_code: i32) -> Result<String, EnumError> {
    let language_code_enum =
        LanguageCode::from_i32(language_code).ok_or_else(|| EnumError::Error {
            msg: "Invalid language code".to_string(),
        })?;
    let language = Language::from(language_code_enum);

    let key = SaplingKey::from_words(words, language)
        .map_err(|e| EnumError::Error { msg: e.to_string() })?;
    Ok(key.hex_spending_key())
}

#[uniffi::export]
fn generate_key_from_private_key(private_key: String) -> Result<Key, EnumError> {
    let sapling_key =
        SaplingKey::from_hex(&private_key).map_err(|e| EnumError::Error { msg: e.to_string() })?;

    Ok(Key {
        spending_key: sapling_key.hex_spending_key(),
        view_key: sapling_key.view_key().hex_key(),
        incoming_view_key: sapling_key.incoming_view_key().hex_key(),
        outgoing_view_key: sapling_key.outgoing_view_key().hex_key(),
        public_address: sapling_key.public_address().hex_public_address(),
        proof_authorizing_key: bytes_to_hex(
            &sapling_key.sapling_proof_generation_key().nsk.to_bytes(),
        ),
    })
}

#[uniffi::export]
pub fn is_valid_public_address(hex_address: String) -> bool {
    PublicAddress::from_hex(&hex_address).is_ok()
}

#[uniffi::export]
pub fn unpack_gzip(gzip_path: String, output_path: String) -> bool {
    let trimmed_path = gzip_path.replacen("file://", "", 1);
    let trimmed_new_path: String = output_path.replacen("file://", "", 1);

    let result = fs::read(&trimmed_path).unwrap();
    let mut decoder = DeflateDecoder::new(&result);
    let contents = decoder.decode_gzip().unwrap();
    fs::write(trimmed_new_path, contents).unwrap();
    fs::remove_file(&trimmed_path).unwrap();
    true
}

#[uniffi::export]
pub fn read_partial_file(path: String, offset: u32, length: u32) -> Vec<u8> {
    let trimmed_path = path.replacen("file://", "", 1);

    let mut result = File::open(trimmed_path).unwrap();
    result.seek(SeekFrom::Start(offset as u64)).unwrap();
    let mut buf = vec![0u8; length as usize];

    result.read_exact(&mut buf).unwrap();
    buf
}

#[uniffi::export(async_runtime = "tokio")]
pub async fn decrypt_notes_for_owner(
    note_encrypteds: Vec<String>,
    incoming_hex_key: String,
) -> Result<Vec<DecryptedNote>, EnumError> {
    let incoming_view_key = ironfish::IncomingViewKey::from_hex(&incoming_hex_key)
        .map_err(|e| EnumError::Error { msg: e.to_string() })?;

    let idxes = note_encrypteds
        .par_iter()
        .enumerate()
        .filter_map(|(i, output)| {
            let bytes = const_hex::decode(output);
            if bytes.is_err() {
                eprintln!("error converting hex to bytes");
                return None;
            }

            let note = ironfish::MerkleNote::read(bytes.unwrap().as_slice());
            if note.is_err() {
                eprintln!("error reading bytes");
                return None;
            }

            let dec: Result<ironfish::Note, ironfish::errors::IronfishError> =
                note.unwrap().decrypt_note_for_owner(&incoming_view_key);

            if dec.is_err() {
                return None;
            }

            let mut vec = vec![];
            if dec
                .unwrap()
                .write(&mut vec)
                .map_err(|e| EnumError::Error { msg: e.to_string() })
                .is_err()
            {
                eprintln!("error writing bytes");
                return None;
            }

            Some(DecryptedNote {
                index: i as u32,
                note: const_hex::encode(&vec),
            })
        });

    Ok(idxes.collect())
}

#[uniffi::export(async_runtime = "tokio")]
pub async fn decrypt_notes_for_spender(
    note_encrypteds: Vec<String>,
    outgoing_hex_key: String,
) -> Result<Vec<DecryptedNote>, EnumError> {
    let outgoing_view_key = ironfish::OutgoingViewKey::from_hex(&outgoing_hex_key)
        .map_err(|e| EnumError::Error { msg: e.to_string() })?;

    let idxes = note_encrypteds
        .par_iter()
        .enumerate()
        .filter_map(|(i, output)| {
            let bytes = const_hex::decode(output);
            if bytes.is_err() {
                eprintln!("error converting hex to bytes");
                return None;
            }

            let note = ironfish::MerkleNote::read(bytes.unwrap().as_slice());
            if note.is_err() {
                eprintln!("error reading bytes");
                return None;
            }

            let dec: Result<ironfish::Note, ironfish::errors::IronfishError> =
                note.unwrap().decrypt_note_for_spender(&outgoing_view_key);

            if dec.is_err() {
                return None;
            }

            let mut vec = vec![];
            if dec
                .unwrap()
                .write(&mut vec)
                .map_err(|e| EnumError::Error { msg: e.to_string() })
                .is_err()
            {
                eprintln!("error writing bytes");
                return None;
            }

            Some(DecryptedNote {
                index: i as u32,
                note: const_hex::encode(&vec),
            })
        });

    Ok(idxes.collect())
}

#[uniffi::export]
pub fn nullifier(note: String, position: String, view_key: String) -> Result<String, EnumError> {
    let view_key = ironfish::ViewKey::from_hex(&view_key)
        .map_err(|e| EnumError::Error { msg: e.to_string() })?;

    let bytes = const_hex::decode(note).map_err(|e| EnumError::Error { msg: e.to_string() })?;

    let position_u64 = position
        .parse::<u64>()
        .map_err(|e| EnumError::Error { msg: e.to_string() })?;

    let note = Note::read(&bytes[..]).map_err(|e| EnumError::Error { msg: e.to_string() })?;

    Ok(const_hex::encode(note.nullifier(&view_key, position_u64).0))
}

#[uniffi::export]
pub fn create_note(params: NoteParams) -> Result<Vec<u8>, EnumError> {
    let mut owner_vec = Cursor::new(params.owner);
    let mut sender_vec = Cursor::new(params.sender);

    //memo
    let num_to_copy = cmp::min(params.memo.len(), MEMO_SIZE);
    let mut memo_bytes = [0; MEMO_SIZE];
    memo_bytes[..num_to_copy].copy_from_slice(&params.memo[..num_to_copy]);

    //asset id
    let mut asset_id_bytes = [0; ID_LENGTH];
    asset_id_bytes.clone_from_slice(&params.asset_id[0..ID_LENGTH]);
    let asset_id = asset_id_bytes.try_into().map_err(|_| EnumError::Error {
        msg: "Error converting to AssetIdentifier".to_string(),
    })?;

    let note = Note::new(
        PublicAddress::read(&mut owner_vec).map_err(|e| EnumError::Error { msg: e.to_string() })?,
        params.value,
        memo_bytes,
        asset_id,
        PublicAddress::read(&mut sender_vec)
            .map_err(|e| EnumError::Error { msg: e.to_string() })?,
    );

    let mut arr: Vec<u8> = vec![];
    note.write(&mut arr)
        .map_err(|e| EnumError::Error { msg: e.to_string() })?;

    Ok(arr)
}

#[uniffi::export]
pub fn create_transaction(
    transaction_version: u8,
    transaction_fee: u64,
    expiration_sequence: u32,
    spend_components: Vec<SpendComponents>,
    outputs: Vec<Vec<u8>>,
    spending_key: Vec<u8>,
) -> Result<Vec<u8>, EnumError> {
    let version = ironfish::transaction::TransactionVersion::from_u8(transaction_version)
        .ok_or_else(|| EnumError::Error {
            msg: "Invalid transaction version".to_string(),
        })?;

    let mut transaction = ironfish::ProposedTransaction::new(version);
    for spend_component in spend_components {
        let note_data = Cursor::new(spend_component.note);
        let note =
            ironfish::Note::read(note_data).map_err(|e| EnumError::Error { msg: e.to_string() })?;

        let root_hash_data = Cursor::new(spend_component.witness_root_hash);
        let root_hash = MerkleNoteHash::read(root_hash_data)
            .map_err(|e| EnumError::Error { msg: e.to_string() })?
            .0;
        let witness_auth_path: Vec<ironfish::witness::WitnessNode<Scalar>> = spend_component
            .witness_auth_path
            .into_iter()
            .map(|witness_node| {
                let hash_of_sibling_data = Cursor::new(witness_node.hash_of_sibling);
                let hash_of_sibling: Scalar = MerkleNoteHash::read(hash_of_sibling_data)
                    .map_err(|e| EnumError::Error { msg: e.to_string() })?
                    .0;
                match witness_node.side.as_str() {
                    "Left" => Ok(ironfish::witness::WitnessNode::Left(hash_of_sibling)),
                    "Right" => Ok(ironfish::witness::WitnessNode::Right(hash_of_sibling)),
                    _ => Err(EnumError::Error {
                        msg: "Invalid side".to_string(),
                    }),
                }
            })
            .collect::<Result<Vec<ironfish::witness::WitnessNode<Scalar>>, EnumError>>()?;
        let witness = ironfish::witness::Witness {
            root_hash,
            tree_size: spend_component.witness_tree_size as usize,
            auth_path: witness_auth_path,
        };
        transaction
            .add_spend(note, &witness)
            .map_err(|e| EnumError::Error { msg: e.to_string() })?;
    }

    for output in outputs {
        let output_data = Cursor::new(output);
        let output = ironfish::Note::read(output_data)
            .map_err(|e| EnumError::Error { msg: e.to_string() })?;
        transaction
            .add_output(output)
            .map_err(|e| EnumError::Error { msg: e.to_string() })?;
    }

    transaction.set_expiration(expiration_sequence);

    let mut spending_key_data = Cursor::new(spending_key);
    let spending_key = ironfish::SaplingKey::read(&mut spending_key_data)
        .map_err(|e| EnumError::Error { msg: e.to_string() })?;

    let posted = transaction
        .post(&spending_key, None, transaction_fee)
        .map_err(|e| EnumError::Error { msg: e.to_string() })?;
    let mut buffer: Vec<u8> = Vec::new();
    posted
        .write(&mut buffer)
        .map_err(|e| EnumError::Error { msg: e.to_string() })?;
    Ok(buffer)
}
