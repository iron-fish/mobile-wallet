extern crate num;
#[macro_use]
extern crate num_derive;

use std::{
    fs::{self, File},
    io::{Read, Seek, SeekFrom},
};
use tokio_rayon::rayon::iter::{
    IndexedParallelIterator, IntoParallelRefIterator, ParallelIterator,
};
use zune_inflate::DeflateDecoder;

use crate::num::FromPrimitive;
use ironfish::{keys::Language, serializing::bytes_to_hex, PublicAddress, SaplingKey};

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
    note_encrypted: Vec<String>,
    incoming_hex_key: String,
) -> Result<Vec<DecryptedNote>, EnumError> {
    let incoming_view_key = ironfish::IncomingViewKey::from_hex(&incoming_hex_key)
        .map_err(|e| EnumError::Error { msg: e.to_string() })?;

    let idxes = note_encrypted
        .par_iter()
        .enumerate()
        .filter_map(|(i, output)| {
            let bytes = const_hex::decode(output);
            if bytes.is_err() {
                println!("error converting hex to bytes");
                return None;
            }

            let note = ironfish::MerkleNote::read(bytes.unwrap().as_slice());
            if note.is_err() {
                println!("error reading bytes");
                return None;
            }

            let dec: Result<ironfish::Note, ironfish::errors::IronfishError> =
                note.unwrap().decrypt_note_for_owner(&incoming_view_key);
            if dec.is_ok() {
                let mut vec = vec![];
                if dec
                    .unwrap()
                    .write(&mut vec)
                    .map_err(|e| EnumError::Error { msg: e.to_string() })
                    .is_err()
                {
                    println!("error writing bytes");
                    return None;
                }

                return Some(DecryptedNote {
                    index: i as u32,
                    note: const_hex::encode(&vec),
                });
            }
            None
        });

    Ok(idxes.collect())
}
