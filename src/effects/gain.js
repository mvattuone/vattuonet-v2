module.exports = (bufferSource, config) => {
  const gainNode = offlineAudioCtx.createGain();
  gainNode.gain.value = config.gain.value;
  return gainNode;
};