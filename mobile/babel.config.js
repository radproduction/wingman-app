module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Motion phase adds 'react-native-worklets/plugin' (Reanimated 4) here, last.
  };
};
