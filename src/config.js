const effectsConfig = {
  bitcrusher: {
    active: false,
    bits: 4,
    normfreq: 0.1,
    bufferSize: 256
  },
  convolver: {
    active: false,
    highCut: 22050,
    lowCut: 20,
    dryLevel: 1,
    wetLevel: 1,
    level: 1,
    impulse: "CathedralRoom.wav"
  },
  chorus: {
    active: false,
    feedback: 0.4,
    delay: 0.0045,
    depth: 0.7,
    rate: 1.5,
    bypass: 0
  },
  biquad: {
    active: true,
    areaOfEffect: 1,
    detune: 0,
    enablePartial: false,
    randomize: true,
    quality: 1,
    randomValues: 33,
    type: "lowpass",
    biquadFrequency: 30300
  },
  gain: {
    active: false,
    value: 1
  },
  detune: {
    active: true,
    areaOfEffect: 1,
    enablePartial: false,
    randomize: false,
    randomValues: 2,
    value: 0.04
  },
  playbackRate: {
    active: false,
    areaOfEffect: 1,
    enablePartial: false,
    randomize: false,
    randomValues: 2,
    value: 1
  },
  pingPong: {
    active: false,
    feedback: 0.3,
    wetLevel: 0.5,
    delayTimeLeft: 10,
    delayTimeRight: 10
  },
  phaser: {
    active: false,
    rate: 1.2,
    depth: 0.4,
    feedback: 0.5,
    stereoPhase: 10,
    baseModulationFrequency: 500
  }
}

module.exports = {
  effectsConfig
}
