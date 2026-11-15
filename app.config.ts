import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const configuredProjectId = config.extra?.eas && typeof config.extra.eas === 'object'
    ? (config.extra.eas as { projectId?: string }).projectId
    : undefined;
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() || configuredProjectId;

  if (projectId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId)) {
    throw new Error('EXPO_PUBLIC_EAS_PROJECT_ID tem de ser o UUID do projeto EAS.');
  }

  return {
    ...config,
    runtimeVersion: { policy: 'appVersion' },
    updates: projectId
      ? {
          enabled: true,
          url: `https://u.expo.dev/${projectId}`,
          requestHeaders: { 'expo-channel-name': 'preview' },
          checkAutomatically: 'ON_LOAD',
          fallbackToCacheTimeout: 5000,
        }
      : { enabled: false },
    plugins: [...(config.plugins ?? []), 'expo-updates'],
    extra: {
      ...(config.extra ?? {}),
      ...(projectId ? { eas: { projectId } } : {}),
    },
  };
};
