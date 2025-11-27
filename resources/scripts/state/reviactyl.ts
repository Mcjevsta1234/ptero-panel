import { action, Action } from 'easy-peasy';

export interface ReviactylSettings {
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

export interface ReviactylSettingsStore {
    data?: ReviactylSettings;
    setReviactyl: Action<ReviactylSettingsStore, ReviactylSettings>;
}

const reviactyl: ReviactylSettingsStore = {
    data: undefined,

    setReviactyl: action((state, payload) => {
        state.data = payload;
    }),
};

export default reviactyl;
