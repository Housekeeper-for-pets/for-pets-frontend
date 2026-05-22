export const portOneConfig = {
  storeId:
    import.meta.env.VITE_PORTONE_STORE_ID ??
    'store-83ad3779-df36-40b5-ac96-31d4b94c5d6d',
  channelKey:
    import.meta.env.VITE_PORTONE_CHANNEL_KEY ??
    'channel-key-48071a12-617d-43df-a5ae-3867ae737cff',
} as const;

export const hasPortOneConfig = Boolean(
  portOneConfig.storeId && portOneConfig.channelKey,
);
