use keyring::{Entry, Error};

const SERVICE_NAME: &str = "overlay-core.providers";

fn entry(provider_id: &str) -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, provider_id)
        .map_err(|error| format!("failed to access provider credential store: {error}"))
}

pub fn get_api_key(provider_id: &str) -> Result<Option<String>, String> {
    match entry(provider_id)?.get_password() {
        Ok(api_key) => Ok(Some(api_key.trim().to_string()).filter(|api_key| !api_key.is_empty())),
        Err(Error::NoEntry) => Ok(None),
        Err(error) => Err(format!("failed to read provider API key: {error}")),
    }
}

pub fn has_api_key(provider_id: &str) -> Result<bool, String> {
    Ok(get_api_key(provider_id)?.is_some())
}

pub fn save_api_key(provider_id: &str, api_key: &str) -> Result<(), String> {
    entry(provider_id)?
        .set_password(api_key)
        .map_err(|error| format!("failed to save provider API key: {error}"))
}

pub fn remove_api_key(provider_id: &str) -> Result<(), String> {
    match entry(provider_id)?.delete_credential() {
        Ok(()) | Err(Error::NoEntry) => Ok(()),
        Err(error) => Err(format!("failed to remove provider API key: {error}")),
    }
}
