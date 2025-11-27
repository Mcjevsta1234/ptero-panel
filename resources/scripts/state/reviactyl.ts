import { action, Action } from 'easy-peasy';

export interface WitchyWorldsSettings {
    customCopyright: boolean;
    copyright: string;
    isUnderMaintenance: boolean;
    maintenance: string;
    themeSelector: boolean;
    allocationBlur: boolean;
    alertType: string;
    alertMessage: string;
    socialBilling?: string;
    socialStatus?: string;
    socialDiscord?: string;
    socialWebsite?: string;
}

export interface WitchyWorldsSettingsStore {
    data?: WitchyWorldsSettings;
    setWitchyWorlds: Action<WitchyWorldsSettingsStore, WitchyWorldsSettings>;
}

const witchyworlds: WitchyWorldsSettingsStore = {
    data: undefined,

    setWitchyWorlds: action((state, payload) => {
        state.data = payload;
    }),
};

export default witchyworlds;
