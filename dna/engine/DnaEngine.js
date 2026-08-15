/**
 * CreativeCode.my — Visual DNA Mutation & Chromosome Engine
 */
import { COLORWAYS, applyColorwayToDom } from "./Colorways.js";
import { soundSynth } from "./SoundSynth.js";

export class DnaEngine {
  constructor(manifest) {
    this.manifest = manifest;
    this.currentSeed = this.generateRandomSeed();
    this.generation = 1;
    this.activeColorwayId = "cyber_neon";
    this.listeners = new Set();
  }

  generateRandomSeed() {
    return "0x" + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0").toUpperCase();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const cb of this.listeners) {
      cb({
        seed: this.currentSeed,
        generation: this.generation,
        colorway: COLORWAYS[this.activeColorwayId]
      });
    }
  }

  setColorway(colorwayId) {
    if (COLORWAYS[colorwayId]) {
      this.activeColorwayId = colorwayId;
      applyColorwayToDom(colorwayId);
      soundSynth.playBeep(980, 0.05, "triangle");
      this.notify();
    }
  }

  mutateParameters(paramDefinitions, currentValues, rate = 0.3) {
    const mutated = { ...currentValues };
    const seedInt = parseInt(this.currentSeed, 16) || 12345;
    let rng = (seedInt ^ (this.generation * 7919)) % 100000 / 100000;

    for (const [key, def] of Object.entries(paramDefinitions)) {
      if (Math.random() < rate) {
        const span = def.max - def.min;
        const delta = (Math.random() * 2 - 1) * span * 0.25;
        let newVal = (mutated[key] !== undefined ? mutated[key] : def.value) + delta;
        newVal = Math.max(def.min, Math.min(def.max, newVal));
        if (def.step >= 1) newVal = Math.round(newVal);
        else newVal = parseFloat(newVal.toFixed(2));
        mutated[key] = newVal;
      }
    }

    this.generation++;
    this.currentSeed = this.generateRandomSeed();
    soundSynth.playMutationChirp();
    this.notify();
    return mutated;
  }

  crossBreed(dnaA, dnaB) {
    const child = {};
    for (const key of Object.keys({ ...dnaA, ...dnaB })) {
      child[key] = Math.random() > 0.5 ? dnaA[key] : dnaB[key];
    }
    this.generation++;
    this.currentSeed = this.generateRandomSeed();
    soundSynth.playBeep(1200, 0.12, "sine");
    this.notify();
    return child;
  }

  exportDnaJson(projectMeta, parameters) {
    const payload = {
      format: "CreativeCode-VisualDNA-v2",
      timestamp: new Date().toISOString(),
      seed: this.currentSeed,
      generation: this.generation,
      colorway: this.activeColorwayId,
      project: projectMeta.id,
      parameters
    };
    return JSON.stringify(payload, null, 2);
  }
}
