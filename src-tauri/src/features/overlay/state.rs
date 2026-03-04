use std::sync::Mutex;

pub struct OverlayRuntimeState {
    interaction_enabled: Mutex<bool>,
}

impl OverlayRuntimeState {
    pub fn with_defaults() -> Self {
        Self {
            interaction_enabled: Mutex::new(false),
        }
    }

    pub fn get(&self) -> bool {
        *self
            .interaction_enabled
            .lock()
            .expect("overlay runtime lock poisoned")
    }

    pub fn set(&self, enabled: bool) {
        *self
            .interaction_enabled
            .lock()
            .expect("overlay runtime lock poisoned") = enabled;
    }
}
