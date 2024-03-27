uniffi::setup_scaffolding!();

#[uniffi::export]
fn rust_add(left: i32, right: i32) -> i32 {
    left + right
}
