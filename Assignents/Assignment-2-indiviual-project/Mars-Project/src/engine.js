export const STORAGE_KEY = "mars-os-save-v1";

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function resourceStatus(resource) {
  if (resource.value <= resource.critical) return "critical";
  if (resource.value <= resource.critical + 15) return "warning";
  return "nominal";
}

export function estimateDays(resource, crew = 12) {
  const netDailyUse = Math.max(0.15, resource.consumption - resource.production);
  return Math.max(0, Math.round((resource.value / 100) * resource.capacity / netDailyUse * (12 / Math.max(1, crew))));
}

export function calculateRisk(resources, systems) {
  const resourceRisk = resources.reduce((sum, resource) => {
    if (resource.value <= resource.critical) return sum + 28;
    if (resource.value <= resource.critical + 15) return sum + 12;
    return sum + (100 - resource.value) * 0.08;
  }, 0);
  const systemRisk = systems.reduce((sum, system) => sum + (100 - system.health) * 0.12, 0);
  return Math.round(clamp(resourceRisk + systemRisk, 0, 100));
}

export function simulateSol(state, options = {}) {
  const autonomy = options.autonomy ?? state.autonomy;
  const resourceChanges = {};
  const logs = [...state.logs];
  const resources = state.resources.map((resource) => {
    let delta = resource.production - resource.consumption;
    if (resource.id === "energy" && state.activeScenario?.id === "dust-storm") delta -= 2.5;
    if (autonomy && resource.value < resource.critical + 18) {
      delta += resource.id === "energy" ? 1.8 : 0.8;
      resourceChanges[resource.id] = "conservation enabled";
    }
    const value = clamp(Number((resource.value + delta).toFixed(1)));
    return { ...resource, value };
  });

  const systems = state.systems.map((system) => {
    if (state.activeScenario?.system === system.id) {
      return { ...system, health: clamp(system.health - 2, 0, 100), status: "warning" };
    }
    return { ...system, health: clamp(system.health - 0.15, 0, 100) };
  });

  const nextSol = state.sol + 1;
  logs.unshift({
    id: `${Date.now()}-${nextSol}`,
    sol: nextSol,
    type: "info",
    title: `Sol ${nextSol} simulation complete`,
    message: autonomy ? "Autonomous resource policy evaluated." : "Manual resource policy applied.",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  });

  const next = { ...state, resources, systems, sol: nextSol, logs: logs.slice(0, 30) };
  return { ...next, risk: calculateRisk(resources, systems) };
}

export function applyScenario(state, scenario) {
  const resources = state.resources.map((resource) => ({
    ...resource,
    value: clamp(Number((resource.value + (scenario.effects[resource.id] || 0)).toFixed(1)))
  }));
  const systems = state.systems.map((system) =>
    system.id === scenario.system
      ? { ...system, health: clamp(system.health - 18), status: "warning" }
      : system
  );
  const log = {
    id: `${Date.now()}-${scenario.id}`,
    sol: state.sol,
    type: scenario.severity === "critical" ? "critical" : "warning",
    title: scenario.name,
    message: scenario.description,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
  return {
    ...state,
    resources,
    systems,
    activeScenario: scenario,
    logs: [log, ...state.logs].slice(0, 30),
    risk: calculateRisk(resources, systems)
  };
}

export function recoverSystem(state, systemId) {
  const systems = state.systems.map((system) =>
    system.id === systemId ? { ...system, health: clamp(system.health + 20), status: "nominal" } : system
  );
  const log = {
    id: `${Date.now()}-repair-${systemId}`,
    sol: state.sol,
    type: "success",
    title: "Maintenance action completed",
    message: `${systems.find((s) => s.id === systemId)?.name || systemId} health improved by 20%.`,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
  return { ...state, systems, logs: [log, ...state.logs].slice(0, 30), risk: calculateRisk(state.resources, systems) };
}

export function makeScenarioComparison(state, scenarios) {
  return scenarios.map((scenario) => {
    const resources = state.resources.map((resource) => ({
      ...resource,
      value: clamp(resource.value + (scenario.effects[resource.id] || 0))
    }));
    const systems = state.systems.map((system) =>
      system.id === scenario.system ? { ...system, health: clamp(system.health - 18) } : system
    );
    return {
      ...scenario,
      projectedRisk: calculateRisk(resources, systems),
      lowestResource: resources.reduce((lowest, item) => item.value < lowest.value ? item : lowest, resources[0]),
      projectedResources: resources
    };
  }).sort((a, b) => a.projectedRisk - b.projectedRisk);
}

export function recommendActions(state) {
  const actions = [];
  for (const resource of state.resources) {
    if (resource.value <= resource.critical) {
      actions.push({ priority: "CRITICAL", title: `Protect ${resource.name} reserves`, detail: `Current level is ${resource.value}%. Suspend nonessential consumption and inspect the relevant subsystem.` });
    } else if (resource.value <= resource.critical + 15) {
      actions.push({ priority: "HIGH", title: `Conserve ${resource.name}`, detail: `Reserve is approaching the configured critical threshold of ${resource.critical}%.` });
    }
  }
  const weakSystem = [...state.systems].sort((a, b) => a.health - b.health)[0];
  if (weakSystem && weakSystem.health < 90) {
    actions.push({ priority: weakSystem.health < 70 ? "HIGH" : "MEDIUM", title: `Inspect ${weakSystem.name}`, detail: `System health is ${weakSystem.health}%. Schedule maintenance before further degradation.` });
  }
  if (state.autonomy) {
    actions.push({ priority: "INFO", title: "Autonomous policy is active", detail: "Low-resource conservation rules will be evaluated each time you advance a Sol." });
  }
  if (!actions.length) actions.push({ priority: "LOW", title: "Colony operating within nominal limits", detail: "Continue routine monitoring and keep emergency reserves available." });
  return actions.slice(0, 5);
}