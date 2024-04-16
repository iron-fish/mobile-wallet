extern crate num;
#[macro_use]
extern crate num_derive;

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
pub fn words_to_spending_key(
    words: String,
    language_code: i32,
) -> Result<String, EnumError> {
    let language_code_enum = LanguageCode::from_i32(language_code).ok_or_else(|| EnumError::Error { msg: "Invalid language code".to_string() })?;
    let language = Language::from(language_code_enum);

    let key = SaplingKey::from_words(words, language).map_err(|e| EnumError::Error { msg: e.to_string() })?;
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
