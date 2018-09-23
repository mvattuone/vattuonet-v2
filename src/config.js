const effectsConfig = {
  biquad: {
    active: true,
    areaOfEffect: 1,
    detune: 0,
    enablePartial: false,
    randomize: false,
    quality: 400,
    randomValues: 2,
    type: "lowpass",
    biquadFrequency: 19000
  },
  gain: {
    active: false,
    value: 1
  },
  detune: {
    active: false,
    areaOfEffect: 1,
    enablePartial: false,
    randomize: false,
    randomValues: 2,
    value: 1
  },
  playbackRate: {
    active: false,
    areaOfEffect: 1,
    enablePartial: false,
    randomize: false,
    randomValues: 2,
    value: 1
  }
}

module.exports = {
  effectsConfig
}
