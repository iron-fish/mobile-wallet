use ironfish::{serializing::bytes_to_hex, SaplingKey};

uniffi::setup_scaffolding!();

#[derive(thiserror::Error, uniffi::Error, Debug)]
pub enum EnumError {
    #[error("Error: {msg}")]
    Error { msg: String },
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
