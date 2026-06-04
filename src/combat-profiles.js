export const COMBAT_PROFILES = {
  "Empty Hand": {
    family: "unarmed",
    kind: "unarmed",
    stance: "guard",
    windup: 0.38,
    strike: 0.16,
    recovery: 0.46,
    hitMoment: 0.48,
    releaseMoment: 0,
    durationBase: 0.54,
    minDuration: 0.24,
    rangeBonus: 0,
    mobTuning: { durationScale: 1.42, minDuration: 0.52, lunge: 0.28 },
    modelProfile: { assetKey: "unarmed", procedural: true },
    trail: { enabled: false, start: 0.28, end: 0.66, length: 1.05, width: 0.28, color: "#f6d6a6", opacity: 0.18 },
    pose: {
      reach: 1.08,
      lateral: 0.62,
      centerLine: 0.48,
      lift: 0.36,
      chamber: 0.38,
      windupX: -0.54,
      strikeX: -1.04,
      recoverX: -0.14,
      windupZ: -0.76,
      strikeZ: 0.58,
      recoverZ: -0.12,
      armBaseX: -0.38,
      armChamberX: -0.42,
      armStrikeX: -1.22,
      elbowBase: 0.72,
      elbowStrike: 0.24,
      wristStrike: -0.05,
      torsoTwist: 0.16,
      torsoLean: 0.08,
      footPlant: 0.14
    },
    hitVolume: {
      reachBonus: 0.78,
      halfWidth: 0.82,
      minForward: -0.08,
      enemyRadiusScale: 0.72,
      traceLength: 2.2,
      traceWidth: 0.1,
      slashRadius: 0.72
    },
    impactProfile: { weight: 0.62, camera: 0.016, hitstop: 0.038, flinch: 0.32, blood: 0.75 }
  },
  Dagger: {
    family: "shortBlade",
    kind: "slash",
    stance: "close",
    windup: 0.22,
    strike: 0.3,
    recovery: 0.48,
    hitMoment: 0.38,
    releaseMoment: 0,
    durationBase: 0.38,
    minDuration: 0.16,
    rangeBonus: 0,
    mobTuning: { durationScale: 1.36, minDuration: 0.48, lunge: 0.24 },
    modelProfile: { assetKey: "dagger", bladeLength: 1.48, bladeWidth: 0.17, handleLength: 0.66, procedural: true },
    trail: { enabled: true, start: 0.18, end: 0.58, length: 1.45, width: 0.22, color: "#dfe9ff", opacity: 0.34 },
    pose: {
      reach: 0.94,
      lateral: 0.92,
      lift: 0.1,
      windupX: -0.38,
      strikeX: -0.8,
      recoverX: -0.12,
      windupZ: -0.92,
      strikeZ: 1.58,
      recoverZ: -0.4,
      windupY: -0.18,
      strikeY: 0.22,
      elbowBase: 0.34,
      elbowStrike: 0.22,
      wristStrike: -0.04,
      torsoTwist: 0.1,
      torsoLean: 0.03,
      footPlant: 0.06
    },
    hitVolume: {
      reachBonus: 0.78,
      halfWidth: 0.92,
      minForward: -0.22,
      enemyRadiusScale: 0.66,
      traceLength: 2.1,
      traceWidth: 0.12,
      slashRadius: 0.9
    },
    impactProfile: { weight: 0.5, camera: 0.014, hitstop: 0.035, flinch: 0.24, blood: 0.9 }
  },
  Sword: {
    family: "blade",
    kind: "slash",
    stance: "oneHandSlash",
    windup: 0.28,
    strike: 0.34,
    recovery: 0.38,
    hitMoment: 0.43,
    releaseMoment: 0,
    durationBase: 0.43,
    minDuration: 0.18,
    rangeBonus: 0,
    mobTuning: { durationScale: 1.42, minDuration: 0.54, lunge: 0.36 },
    modelProfile: { assetKey: "sword", bladeLength: 2.65, bladeWidth: 0.2, handleLength: 0.88, procedural: true },
    trail: { enabled: true, start: 0.22, end: 0.66, length: 2.65, width: 0.32, color: "#d9e8ff", opacity: 0.3 },
    pose: {
      reach: 1.08,
      lateral: 1.02,
      lift: 0.08,
      windupX: -0.52,
      strikeX: -0.9,
      recoverX: -0.16,
      windupZ: -1.12,
      strikeZ: 2.08,
      recoverZ: -0.56,
      windupY: -0.2,
      strikeY: 0.18,
      elbowBase: 0.36,
      elbowStrike: 0.22,
      wristStrike: -0.04,
      torsoTwist: 0.16,
      torsoLean: 0.04,
      footPlant: 0.08
    },
    hitVolume: {
      reachBonus: 1.18,
      halfWidth: 1.38,
      minForward: -0.34,
      enemyRadiusScale: 0.72,
      traceLength: 3.45,
      traceWidth: 0.14,
      slashRadius: 1.3
    },
    impactProfile: { weight: 0.66, camera: 0.018, hitstop: 0.045, flinch: 0.32, blood: 1 }
  },
  "Long Sword": {
    family: "greatBlade",
    kind: "slash",
    stance: "twoHandSlash",
    windup: 0.34,
    strike: 0.34,
    recovery: 0.32,
    hitMoment: 0.46,
    releaseMoment: 0,
    durationBase: 0.48,
    minDuration: 0.2,
    rangeBonus: 0,
    mobTuning: { durationScale: 1.48, minDuration: 0.62, lunge: 0.42 },
    modelProfile: { assetKey: "long-sword", bladeLength: 3.55, bladeWidth: 0.23, handleLength: 1.18, procedural: true },
    trail: { enabled: true, start: 0.24, end: 0.72, length: 3.8, width: 0.42, color: "#dbeaff", opacity: 0.34 },
    pose: {
      reach: 1.24,
      lateral: 1.26,
      lift: 0.18,
      windupX: -0.62,
      strikeX: -1.02,
      recoverX: -0.18,
      windupZ: -1.22,
      strikeZ: 2.54,
      recoverZ: -0.62,
      windupY: -0.26,
      strikeY: 0.28,
      elbowBase: 0.42,
      elbowStrike: 0.25,
      wristStrike: -0.06,
      torsoTwist: 0.24,
      torsoLean: 0.07,
      footPlant: 0.12,
      offhand: 0.58
    },
    hitVolume: {
      reachBonus: 1.62,
      halfWidth: 1.82,
      minForward: -0.48,
      enemyRadiusScale: 0.78,
      traceLength: 4.65,
      traceWidth: 0.18,
      slashRadius: 1.78
    },
    impactProfile: { weight: 0.82, camera: 0.026, hitstop: 0.055, flinch: 0.42, blood: 1.12 }
  },
  Axe: {
    family: "heavyChop",
    kind: "chop",
    stance: "overhand",
    windup: 0.36,
    strike: 0.32,
    recovery: 0.32,
    hitMoment: 0.54,
    releaseMoment: 0,
    durationBase: 0.52,
    minDuration: 0.22,
    rangeBonus: 0,
    mobTuning: { durationScale: 1.5, minDuration: 0.66, lunge: 0.46 },
    modelProfile: { assetKey: "axe", haftLength: 3, headWidth: 1.08, headHeight: 0.62, procedural: true },
    trail: { enabled: true, start: 0.3, end: 0.78, length: 2.9, width: 0.54, color: "#ffd7a3", opacity: 0.34 },
    pose: {
      reach: 1.08,
      lateral: 1.08,
      lift: 0.84,
      windupX: -1.18,
      strikeX: 0.62,
      recoverX: -0.18,
      windupZ: -0.72,
      strikeZ: 1.42,
      recoverZ: -0.4,
      windupY: -0.2,
      strikeY: 0.36,
      elbowBase: 0.66,
      elbowStrike: 0.34,
      wristStrike: -0.09,
      torsoTwist: 0.22,
      torsoLean: 0.1,
      footPlant: 0.16
    },
    hitVolume: {
      reachBonus: 1.3,
      halfWidth: 1.95,
      minForward: -0.22,
      enemyRadiusScale: 0.8,
      traceLength: 3.55,
      traceWidth: 0.22,
      slashRadius: 1.72
    },
    impactProfile: { weight: 1, camera: 0.034, hitstop: 0.07, flinch: 0.52, blood: 1.05 }
  },
  Spear: {
    family: "polearm",
    kind: "thrust",
    stance: "twoHandThrust",
    windup: 0.3,
    strike: 0.24,
    recovery: 0.46,
    hitMoment: 0.38,
    releaseMoment: 0,
    durationBase: 0.42,
    minDuration: 0.18,
    rangeBonus: 1.35,
    mobTuning: { durationScale: 1.42, minDuration: 0.58, lunge: 0.52 },
    modelProfile: { assetKey: "spear", shaftLength: 4.65, tipLength: 0.82, procedural: true },
    trail: { enabled: true, start: 0.24, end: 0.58, length: 4.1, width: 0.24, color: "#e6f0ff", opacity: 0.28 },
    pose: {
      reach: 1.58,
      lateral: 0.16,
      lift: 0.08,
      windupX: -0.26,
      strikeX: -0.68,
      recoverX: -0.12,
      windupZ: -0.18,
      strikeZ: 0.12,
      recoverZ: -0.08,
      windupY: -0.12,
      strikeY: 0.08,
      elbowBase: 0.22,
      elbowStrike: 0.38,
      wristStrike: -0.08,
      torsoTwist: 0.08,
      torsoLean: 0.08,
      footPlant: 0.18,
      offhand: 0.72
    },
    hitVolume: {
      reachBonus: 0.44,
      halfWidth: 0.54,
      minForward: 0.18,
      enemyRadiusScale: 0.52,
      traceLength: 5.5,
      traceWidth: 0.12,
      slashRadius: 0.42
    },
    impactProfile: { weight: 0.78, camera: 0.022, hitstop: 0.045, flinch: 0.44, blood: 1.08 }
  },
  Bow: {
    family: "bow",
    kind: "bow",
    stance: "draw",
    windup: 0.2,
    strike: 0.22,
    recovery: 0.58,
    hitMoment: 0.58,
    releaseMoment: { tap: 0.26, charged: 0.1 },
    durationBase: 0.34,
    minDuration: 0.16,
    chargeable: true,
    chargeRangeScale: { base: 0.92, charged: 1.05 },
    chargeDamageScale: { base: 0.68, charged: 0.82 },
    mobTuning: { durationScale: 1.55, minDuration: 0.7, lunge: 0 },
    modelProfile: { assetKey: "bow", height: 2.78, stringOffset: 0.42, arrowLength: 1.5, procedural: true },
    trail: { enabled: false, start: 0.08, end: 0.26, length: 1.2, width: 0.12, color: "#fff4c7", opacity: 0.24 },
    pose: {
      draw: 0.76,
      reach: 0.36,
      lateral: 0.18,
      lift: 0.16,
      windupX: -1,
      strikeX: -0.5,
      recoverX: -0.18,
      windupZ: 0.36,
      strikeZ: 0.16,
      recoverZ: 0,
      elbowBase: 0.42,
      elbowStrike: 0.26,
      wristStrike: -0.08,
      torsoTwist: 0.08,
      torsoLean: 0.02,
      footPlant: 0.04,
      offhand: 0.8
    },
    hitVolume: null,
    impactProfile: { weight: 0.56, camera: 0.012, hitstop: 0.025, flinch: 0.28, blood: 0.9 }
  },
  Crossbow: {
    family: "crossbow",
    kind: "crossbow",
    stance: "brace",
    windup: 0.14,
    strike: 0.18,
    recovery: 0.68,
    hitMoment: 0.28,
    releaseMoment: 0.18,
    durationBase: 0.45,
    minDuration: 0.22,
    chargeable: false,
    mobTuning: { durationScale: 1.5, minDuration: 0.72, lunge: 0 },
    modelProfile: { assetKey: "crossbow", stockLength: 1.7, limbWidth: 1.9, boltLength: 1.32, procedural: true },
    trail: { enabled: false, start: 0.1, end: 0.24, length: 1.2, width: 0.12, color: "#fff4c7", opacity: 0.22 },
    pose: {
      reach: 0.58,
      lateral: 0.16,
      lift: 0.18,
      windupX: -0.42,
      strikeX: -0.24,
      recoverX: -0.12,
      windupZ: 0.2,
      strikeZ: 0.16,
      recoverZ: 0.04,
      elbowBase: 0.3,
      elbowStrike: 0.42,
      wristStrike: -0.03,
      torsoTwist: 0.06,
      torsoLean: 0.04,
      footPlant: 0.08,
      offhand: 0.62
    },
    hitVolume: null,
    impactProfile: { weight: 0.92, camera: 0.02, hitstop: 0.035, flinch: 0.48, blood: 1.02 }
  },
  "Long Bow": {
    family: "bow",
    kind: "bow",
    stance: "deepDraw",
    windup: 0.24,
    strike: 0.2,
    recovery: 0.56,
    hitMoment: 0.6,
    releaseMoment: { tap: 0.28, charged: 0.1 },
    durationBase: 0.38,
    minDuration: 0.18,
    chargeable: true,
    chargeRangeScale: { base: 0.92, charged: 1.05 },
    chargeDamageScale: { base: 0.68, charged: 0.82 },
    mobTuning: { durationScale: 1.58, minDuration: 0.76, lunge: 0 },
    modelProfile: { assetKey: "long-bow", height: 3.58, stringOffset: 0.48, arrowLength: 1.65, procedural: true },
    trail: { enabled: false, start: 0.08, end: 0.26, length: 1.2, width: 0.12, color: "#fff4c7", opacity: 0.24 },
    pose: {
      draw: 0.9,
      reach: 0.42,
      lateral: 0.2,
      lift: 0.24,
      windupX: -1.08,
      strikeX: -0.52,
      recoverX: -0.18,
      windupZ: 0.38,
      strikeZ: 0.16,
      recoverZ: 0,
      elbowBase: 0.48,
      elbowStrike: 0.28,
      wristStrike: -0.09,
      torsoTwist: 0.1,
      torsoLean: 0.03,
      footPlant: 0.05,
      offhand: 0.86
    },
    hitVolume: null,
    impactProfile: { weight: 0.7, camera: 0.014, hitstop: 0.03, flinch: 0.34, blood: 0.98 }
  }
};

export function getCombatProfile(itemType) {
  return COMBAT_PROFILES[itemType] ?? COMBAT_PROFILES["Empty Hand"];
}

export function getCombatKind(itemType) {
  return getCombatProfile(itemType).kind;
}

export function isProjectileCombatType(itemType) {
  const family = getCombatProfile(itemType).family;
  return family === "bow" || family === "crossbow";
}

export function isChargeableCombatType(itemType) {
  return Boolean(getCombatProfile(itemType).chargeable);
}

export function getCombatAttackDuration(itemType, stats = {}, chargePower = 0, options = {}) {
  const profile = getCombatProfile(itemType);
  const speed = Math.max(0.1, Number(stats?.speed) || 1);
  let base = profile.durationBase;

  if (profile.family === "bow") {
    base = Math.max(0.16, profile.durationBase - chargePower * 0.1);
  }

  let duration = Math.max(profile.minDuration ?? 0.16, base / speed);

  if (options.mob) {
    const tuning = profile.mobTuning ?? {};
    duration = Math.max(tuning.minDuration ?? duration, duration * (tuning.durationScale ?? 1.4));
  }

  return duration;
}

export function getCombatHitMoment(itemType) {
  return getCombatProfile(itemType).hitMoment ?? 0.45;
}

export function getCombatReleaseMoment(itemType, chargePower = 0) {
  const release = getCombatProfile(itemType).releaseMoment;

  if (typeof release === "number") {
    return release;
  }

  if (release && typeof release === "object") {
    return chargePower > 0.08 ? release.charged : release.tap;
  }

  return getCombatHitMoment(itemType);
}

export function getCombatRange(itemType, stats = {}, chargePower = 0) {
  const profile = getCombatProfile(itemType);
  const baseRange = Number(stats?.range) || 1.4;

  if (profile.chargeable) {
    const scale = profile.chargeRangeScale ?? { base: 1, charged: 0 };
    return baseRange * (scale.base + chargePower * scale.charged);
  }

  return baseRange + (profile.rangeBonus ?? 0);
}

export function getCombatDamage(itemType, stats = {}, chargePower = 0) {
  const profile = getCombatProfile(itemType);
  const baseDamage = Number(stats?.damage) || 1;

  if (profile.chargeable) {
    const scale = profile.chargeDamageScale ?? { base: 1, charged: 0 };
    return baseDamage * (scale.base + chargePower * scale.charged);
  }

  return baseDamage;
}

export function getCombatMeleeHitProfile(itemType, range) {
  const profile = getCombatProfile(itemType);
  const baseRange = Math.max(0.6, Number(range) || 1.4);
  const hitVolume = profile.hitVolume ?? COMBAT_PROFILES["Empty Hand"].hitVolume;
  const output = {
    reachBonus: 0.7,
    halfWidth: 0.95,
    minForward: -0.12,
    enemyRadiusScale: 0.68,
    traceLength: baseRange + 0.7,
    traceWidth: 0.1,
    slashRadius: 1,
    ...hitVolume
  };

  if (profile.kind === "thrust") {
    output.minForward = Math.max(output.minForward, 0.16);
  }

  output.reach = baseRange + output.reachBonus;
  output.sweetSpot = Math.max(0.4, output.reach * (profile.kind === "thrust" ? 0.72 : 0.58));
  return output;
}

export function getCombatWeaponHitSegments(itemType, side = -1) {
  const profile = getCombatProfile(itemType);
  const model = profile.modelProfile ?? {};

  if (itemType === "Dagger") {
    return [{ start: [0, -0.08, 0], end: [0, model.bladeLength ?? 1.48, 0], radius: 0.17 }];
  }

  if (itemType === "Sword") {
    return [{ start: [0, -0.1, 0], end: [0, (model.bladeLength ?? 2.65) + 0.38, 0], radius: 0.23 }];
  }

  if (itemType === "Long Sword") {
    return [{ start: [0, -0.16, 0], end: [0, (model.bladeLength ?? 3.55) + 0.54, 0], radius: 0.3 }];
  }

  if (itemType === "Axe") {
    return [
      { start: [0, -0.95, 0], end: [0, 2.28, 0], radius: 0.18 },
      { start: [side * -0.24, 1.92, 0], end: [side * 1.12, 1.92, 0], radius: 0.5 }
    ];
  }

  if (itemType === "Spear") {
    return [{ start: [0, -0.75, 0], end: [0, (model.shaftLength ?? 4.65) + 0.25, 0], radius: 0.17 }];
  }

  return [];
}
