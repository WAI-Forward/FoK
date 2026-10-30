import { MELEE_STYLES } from './combat-motion.js';
import { WEAPON_STATS } from './game-data.js';

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
      reachBonus: 0.15,
      halfWidth: 0.55,
      minForward: -0.18,
      enemyRadiusScale: 0.84,
      traceLength: 2.9,
      traceWidth: 0.1,
      slashRadius: 0.95
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
    durationBase: 0.36,
    minDuration: 0.16,
    rangeBonus: 0,
    combo: {
      sequence: [
        { name: "swipeIn", kind: "slash", slashDirection: -1, cooldownScale: 1.08, durationScale: 0.9 },
        { name: "swipeOut", kind: "slash", slashDirection: 1, cooldownScale: 0.42, durationScale: 0.84 },
        {
          name: "stab",
          kind: "thrust",
          slashDirection: 0,
          cooldownScale: 0.46,
          durationScale: 0.92,
          hitVolume: {
            reachBonus: 1.25,
            halfWidth: 0.78,
            minForward: 0.12,
            enemyRadiusScale: 0.75,
            traceLength: 2.65,
            traceWidth: 0.13,
            slashRadius: 0.42
          }
        }
      ]
    },
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
      halfWidth: 1.3,
      minForward: -0.22,
      enemyRadiusScale: 0.78,
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
    windup: 0.27,
    strike: 0.42,
    recovery: 0.31,
    hitMoment: 0.47,
    releaseMoment: 0,
    durationBase: 0.39,
    minDuration: 0.16,
    rangeBonus: 0,
    combo: {
      steps: 2,
      followUpStep: 1,
      followUpCooldownScale: 0.55,
      resetCooldownScale: 0.92,
      followUpDurationScale: 0.88,
      resetDurationScale: 1
    },
    mobTuning: { durationScale: 1.42, minDuration: 0.54, lunge: 0.36 },
    modelProfile: { assetKey: "sword", bladeLength: 2.65, bladeWidth: 0.2, handleLength: 0.88, procedural: true },
    trail: { enabled: true, start: 0.18, end: 0.72, length: 2.8, width: 0.4, color: "#d9e8ff", opacity: 0.38 },
    pose: {
      reach: 1.18,
      lateral: 1.48,
      lift: 0.12,
      windupX: -0.48,
      strikeX: -0.82,
      recoverX: -0.14,
      windupZ: -1.5,
      strikeZ: 3.05,
      recoverZ: -0.4,
      windupY: -0.36,
      strikeY: 0.64,
      armWindupZ: -0.42,
      armStrikeZ: 1.22,
      armRecoverZ: -0.22,
      armWindupY: -0.48,
      armStrikeY: 0.94,
      armRecoverY: -0.12,
      elbowBase: 0.36,
      elbowStrike: 0.22,
      wristStrike: -0.04,
      torsoTwist: 0.2,
      torsoYaw: 0.3,
      torsoLean: 0.04,
      footPlant: 0.14
    },
    hitVolume: {
      reachBonus: 1.45,
      halfWidth: 0.95,
      minForward: 0.2,
      enemyRadiusScale: 0.76,
      traceLength: 4.2,
      traceWidth: 0.18,
      slashRadius: 1.92
    },
    impactProfile: { weight: 0.66, camera: 0.018, hitstop: 0.045, flinch: 0.32, blood: 1 }
  },
  "Long Sword": {
    family: "greatBlade",
    kind: "slash",
    stance: "twoHandSlash",
    combo: { steps: 2, followUpStep: 1, followUpDurationScale: 1, resetDurationScale: 1 },
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
      halfWidth: 1.05,
      minForward: 0.2,
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
    stance: "wideSwing",
    windup: 0.3,
    strike: 0.42,
    recovery: 0.28,
    hitMoment: 0.55,
    releaseMoment: 0,
    durationBase: 0.58,
    minDuration: 0.26,
    rangeBonus: 0,
    combo: {
      sequence: [
        { name: "swingIn", kind: "chop", slashDirection: -1, cooldownScale: 1, durationScale: 1 },
        { name: "swingOut", kind: "chop", slashDirection: 1, cooldownScale: 1, durationScale: 1 }
      ]
    },
    mobTuning: { durationScale: 1.5, minDuration: 0.66, lunge: 0.46 },
    modelProfile: { assetKey: "axe", haftLength: 3.15, headWidth: 1.18, headHeight: 0.76, procedural: true },
    trail: { enabled: true, start: 0.26, end: 0.76, length: 3.35, width: 0.62, color: "#ffd7a3", opacity: 0.4 },
    pose: {
      reach: 1.34,
      lateral: 1.72,
      lift: 0.48,
      windupX: -0.5,
      strikeX: -0.16,
      windupZ: -1.42,
      strikeZ: 2.72,
      windupY: -0.42,
      strikeY: 0.68,
      elbowBase: 0.72,
      elbowStrike: 0.28,
      wristStrike: -0.09,
      torsoTwist: 0.34,
      torsoYaw: 0.24,
      torsoLean: 0.08,
      footPlant: 0.2
    },
    hitVolume: {
      reachBonus: 1.48,
      halfWidth: 0.85,
      minForward: 0.2,
      enemyRadiusScale: 0.8,
      traceLength: 3.95,
      traceWidth: 0.25,
      slashRadius: 2.18
    },
    impactProfile: { weight: 1, camera: 0.034, hitstop: 0.07, flinch: 0.52, blood: 1.05 }
  },
  Spear: {
    family: "polearm",
    kind: "thrust",
    stance: "twoHandThrust",
    windup: 0.32,
    strike: 0.18,
    recovery: 0.5,
    hitMoment: 0.5,
    releaseMoment: 0,
    durationBase: 0.52,
    minDuration: 0.24,
    rangeBonus: 0.55,
    mobTuning: { durationScale: 1.42, minDuration: 0.58, lunge: 0.52 },
    modelProfile: { assetKey: "spear", shaftLength: 5.45, tipLength: 0.9, procedural: true },
    trail: { enabled: true, start: 0.3, end: 0.61, length: 5.25, width: 0.11, color: "#f4f8ff", opacity: 0.48 },
    pose: {
      reach: 0.95,
      retract: 0.78,
      gripHeight: 3.72,
      lateral: 0,
      lift: 0,
      windupX: 0,
      strikeX: 0,
      recoverX: 0,
      windupZ: 0,
      strikeZ: 0,
      recoverZ: 0,
      windupY: 0,
      strikeY: 0,
      elbowBase: 0.46,
      elbowStrike: 0.3,
      wristStrike: -0.03,
      torsoTwist: 0.025,
      torsoLean: 0.14,
      footPlant: 0.24,
      offhand: 0.9
    },
    hitVolume: {
      reachBonus: 0.35,
      halfWidth: 0.46,
      minForward: 0.42,
      enemyRadiusScale: 0.64,
      traceLength: 6.35,
      traceWidth: 0.16,
      slashRadius: 0.38
    },
    impactProfile: { weight: 0.96, camera: 0.038, hitstop: 0.072, flinch: 0.66, blood: 1.16 }
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
    chargeRangeScale: { base: 0.75, charged: 0.55 },
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
    chargeRangeScale: { base: 0.75, charged: 0.55 },
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

COMBAT_PROFILES.Flail = {
  ...COMBAT_PROFILES.Axe, family: 'flail', kind: 'slash', stance: 'chainSweep',
  windup: .12, strike: .58, recovery: .3, hitMoment: .4,
  combo: null,
  modelProfile: { assetKey: 'flail', procedural: true },
  trail: { ...COMBAT_PROFILES.Axe.trail, length: 1.2, width: .2 },
  impactProfile: { weight: .95, camera: .03, hitstop: .065, flinch: .5, blood: .8 }
};
COMBAT_PROFILES.Sword.combo = { sequence: [
  { name: 'diagonalCut', kind: 'slash', slashDirection: -1 },
  { name: 'returnCut', kind: 'slash', slashDirection: 1, durationScale: .92 },
  { name: 'overheadFinish', kind: 'chop', slashDirection: -1, damageScale: 1.35, durationScale: 1.08 }
] };
COMBAT_PROFILES['Long Sword'].combo = { sequence: [
  { name: 'openingSweep', kind: 'slash', slashDirection: -1 },
  { name: 'returnSweep', kind: 'slash', slashDirection: 1 },
  { name: 'overheadFinish', kind: 'chop', slashDirection: -1, damageScale: 1.4, durationScale: 1.18, knockbackScale: 1.3 }
] };
COMBAT_PROFILES.Spear.combo = { sequence: [
  { name: 'probingJab', kind: 'thrust', durationScale: .85, damageScale: .85 },
  { name: 'drivingThrust', kind: 'thrust', durationScale: 1.1, damageScale: 1.3 }
] };
COMBAT_PROFILES.Dagger.combo.sequence[2].damageScale = 1.5;
COMBAT_PROFILES.Staff = {
  ...COMBAT_PROFILES.Sword, family: 'polearm', kind: 'slash', stance: 'staffSweep',
  windup: .32, strike: .26, recovery: .42, hitMoment: .48,
  modelProfile: { assetKey: 'staff', shaftLength: 5.2, procedural: true },
  pose: { ...COMBAT_PROFILES.Spear.pose },
  hitVolume: { ...COMBAT_PROFILES.Sword.hitVolume, traceLength: 5.1 },
  impactProfile: { weight: .35, camera: .014, hitstop: .03, flinch: .25, blood: 0 },
  combo: { sequence: [
    { name: 'leftSwipe', kind: 'slash', slashDirection: -1 },
    { name: 'rightSwipe', kind: 'slash', slashDirection: 1 },
    { name: 'staffThrust', kind: 'thrust', slashDirection: 0 }
  ] }
};
for (const [type, style] of Object.entries(MELEE_STYLES)) {
  Object.assign(COMBAT_PROFILES[type], { itemType: type, durationBase: style.duration, maxTargets: style.targets });
}
// Wide axe sweeps need anticipation before accelerating through the target.
Object.assign(COMBAT_PROFILES.Axe, { windup: .38, strike: .3, recovery: .32, hitMoment: .53 });

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

export function getCombatComboTiming(itemType, attackIndex = 0) {
  const combo = getCombatProfile(itemType).combo;

  if (!combo) {
    return { step: 0, steps: 1, name: null, kind: null, slashDirection: null, hitVolume: null, isFollowUp: false, cooldownScale: 1, durationScale: 1 };
  }

  const sequence = Array.isArray(combo.sequence) && combo.sequence.length ? combo.sequence : null;
  const steps = sequence?.length ?? Math.max(1, Math.floor(Number(combo.steps) || 1));
  const step = ((Math.floor(Number(attackIndex) || 0) % steps) + steps) % steps;
  const stepProfile = sequence?.[step] ?? {};
  const isFollowUp = sequence ? step > 0 : step === (combo.followUpStep ?? 1);

  return {
    step,
    steps,
    name: stepProfile.name ?? null,
    kind: stepProfile.kind ?? null,
    slashDirection: Number.isFinite(stepProfile.slashDirection) ? stepProfile.slashDirection : null,
    hitVolume: stepProfile.hitVolume ?? null,
    damageScale: stepProfile.damageScale ?? 1,
    knockbackScale: stepProfile.knockbackScale ?? 1,
    isFollowUp,
    cooldownScale: stepProfile.cooldownScale ?? (isFollowUp ? (combo.followUpCooldownScale ?? 1) : (combo.resetCooldownScale ?? 1)),
    durationScale: stepProfile.durationScale ?? (isFollowUp ? (combo.followUpDurationScale ?? 1) : (combo.resetDurationScale ?? 1))
  };
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

  // Keep hit windows and combo cadence on the same, slightly faster clock.
  const playerMelee = !options.mob && (MELEE_STYLES[itemType] || profile.family === 'unarmed');
  return playerMelee ? duration / 1.2 : duration;
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
  const baseRange = WEAPON_STATS[itemType]?.range ?? 1.4;

  if (profile.chargeable) {
    const scale = profile.chargeRangeScale ?? { base: 1, charged: 0 };
    return baseRange * (scale.base + chargePower * scale.charged);
  }

  return baseRange;
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
  if (itemType === 'Staff') return [{ start: [0, .45, 0], end: [0, 4.45, 0], radius: .22 }];
  const profile = getCombatProfile(itemType);
  const model = profile.modelProfile ?? {};

  if (itemType === "Dagger") {
    const grip = (model.handleLength ?? .66) / 2;
    return [{ start: [0, grip, 0], end: [0, grip + (model.bladeLength ?? 1.48), 0], radius: 0.17 }];
  }

  if (itemType === "Sword") {
    const grip = (model.handleLength ?? .88) / 2;
    return [{ start: [0, grip, 0], end: [0, (model.bladeLength ?? 2.65) + grip, 0], radius: 0.23 }];
  }

  if (itemType === "Long Sword") {
    const grip = (model.handleLength ?? 1.18) / 2;
    return [{ start: [0, grip, 0], end: [0, (model.bladeLength ?? 3.55) + grip, 0], radius: 0.3 }];
  }

  if (itemType === "Axe") {
    const headWidth = model.headWidth ?? 1.18;
    return [
      { start: [0, 1.4, 0.82], end: [0, 2.25, 0.75], radius: 0.16 }
    ];
  }

  if (itemType === "Spear") {
    const shaftLength = model.shaftLength ?? 5.45;
    const tipLength = model.tipLength ?? 0.9;
    const tip = 4.3 + tipLength;
    return [{ start: [0, tip - tipLength, 0], end: [0, tip, 0], radius: 0.16 }];
  }

  return [];
}
