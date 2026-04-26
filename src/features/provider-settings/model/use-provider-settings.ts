import { useEffect, useState } from "react";
import { toErrorMessage } from "@/shared/lib/to-error-message";
import {
  getProviderSettings,
  removeProviderCredentials,
  saveProviderSettings,
  type ProviderSettings,
  type ProviderSettingsInput,
} from "./api";
import { getProviderPreset } from "./provider-presets";

export type ProviderSettingsForm = ProviderSettingsInput & {
  apiKey: string;
};

function getDefaultForm(): ProviderSettingsForm {
  const preset = getProviderPreset("openai");

  return {
    providerId: preset.providerId,
    providerName: preset.providerName,
    baseUrl: preset.baseUrl,
    model: preset.model,
    apiKey: "",
  };
}

function settingsToForm(settings: ProviderSettings): ProviderSettingsForm {
  return {
    providerId: settings.providerId,
    providerName: settings.providerName,
    baseUrl: settings.baseUrl,
    model: settings.model,
    apiKey: "",
  };
}

export function useProviderSettings(tauriRuntime: boolean) {
  const [form, setForm] = useState<ProviderSettingsForm>(getDefaultForm);
  const [savedSettings, setSavedSettings] = useState<ProviderSettings | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingCredentials, setIsRemovingCredentials] = useState(false);

  useEffect(() => {
    if (!tauriRuntime) {
      return;
    }

    let canceled = false;

    async function loadProviderSettings() {
      setIsLoading(true);
      setError("");
      setStatus("");

      try {
        const settings = await getProviderSettings();
        if (canceled) {
          return;
        }

        setSavedSettings(settings);
        if (settings) {
          setForm(settingsToForm(settings));
        }
      } catch (loadError) {
        if (!canceled) {
          setError(`Failed to load provider settings: ${toErrorMessage(loadError)}`);
        }
      } finally {
        if (!canceled) {
          setIsLoading(false);
        }
      }
    }

    void loadProviderSettings();

    return () => {
      canceled = true;
    };
  }, [tauriRuntime]);

  function applyPreset(providerId: string) {
    const preset = getProviderPreset(providerId);
    setForm({
      providerId: preset.providerId,
      providerName: preset.providerName,
      baseUrl: preset.baseUrl,
      model: preset.model,
      apiKey: "",
    });
    setError("");
    setStatus("");
  }

  async function save() {
    if (!tauriRuntime) {
      setError("Provider updates are available only in desktop runtime.");
      return;
    }

    setIsSaving(true);
    setError("");
    setStatus("");

    try {
      const nextSettings = await saveProviderSettings({
        providerId: form.providerId,
        providerName: form.providerName,
        baseUrl: form.baseUrl,
        model: form.model,
        apiKey: form.apiKey,
      });
      setSavedSettings(nextSettings);
      setForm(settingsToForm(nextSettings));
      setStatus(`${nextSettings.providerName} saved for ${nextSettings.model}.`);
    } catch (saveError) {
      setError(`Failed to save provider settings: ${toErrorMessage(saveError)}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function removeCredentials() {
    if (!tauriRuntime) {
      setError("Provider credentials are available only in desktop runtime.");
      return;
    }

    setIsRemovingCredentials(true);
    setError("");
    setStatus("");

    try {
      const nextSettings = await removeProviderCredentials();
      setSavedSettings(nextSettings);
      setStatus("Provider API key removed.");
    } catch (removeError) {
      setError(`Failed to remove provider API key: ${toErrorMessage(removeError)}`);
    } finally {
      setIsRemovingCredentials(false);
    }
  }

  return {
    applyPreset,
    error,
    form,
    isLoading,
    isRemovingCredentials,
    isSaving,
    removeCredentials,
    save,
    savedSettings,
    setForm,
    status,
  };
}
