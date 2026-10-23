import React, { useEffect, useMemo, useState } from "react";
import colonyData from "./components/data.json";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BatteryCharging, Check,
  ChevronRight, CircleHelp, Clock3, CloudLightning, Cpu, Droplets, Gauge,
  Globe2, HeartPulse, History, House, Layers3, Menu, Orbit, Pause, Play,
  Radio, RotateCcw, Shield, ShieldAlert, Sprout, Sun, ThermometerSun, Waves,
  Wind, Zap, X, Wrench, BrainCircuit, FlaskConical, Target
} from "lucide-react";
import {
  applyScenario, calculateRisk, estimateDays, loadSavedState, makeScenarioComparison,
  recoverSystem, recommendActions, resourceStatus, saveState, simulateSol
} from "./engine.js";

const ICONS = { oxygen: Wind, water: Droplets, food: Sprout, energy: Zap };
const NAV = [
  { id: "overview", label: "Mission overview", icon: Gauge },
  { id: "colony", label: "Colony digital twin", icon: House },
  { id: "life-support", label: "Life support", icon: HeartPulse },
  { id: "simulator", label: "Scenario lab", icon: FlaskConical },
  { id: "systems", label: "Systems & maintenance", icon: Cpu },
  { id: "logs", label: "Mission event log", icon: History }
];

const initialState = (data) => {
  const saved = loadSavedState();
  if (saved?.resources && saved?.systems && saved?.logs) {
    return { ...saved, scenarios: data.scenarios, colony: data.colony };
  }
  const state = {
    ...data.colony,
    resources: data.resources,
    systems: data.systems,
    scenarios: data.scenarios,
    logs: [
      { id: "seed-1", sol: data.colony.sol, type: "success", title: "Life-support systems nominal", message: "Atmospheric mix and pressure are within mission parameters.", time: "08:14" },
      { id: "seed-2", sol: data.colony.sol, type: "info", title: "Hydroponic harvest completed", message: "Greenhouse nutrient cycle completed successfully.", time: "07:42" },
      { id: "seed-3", sol: data.colony.sol, type: "warning", title: "Water recycler efficiency declining", message: "Efficiency trend suggests a routine inspection this Sol.", time: "06:58" }
    ],
    autonomy: true,
    activeScenario: null,
    risk: 18,
    paused: false
  };
  return { ...state, risk: calculateRisk(state.resources, state.systems) };
};

function App() {
  const [data, setData] = useState(null);
  const [state, setState] = useState(null);
  const [page, setPage] = useState("overview");
  const [selectedSystem, setSelectedSystem] = useState("habitat");
  const [selectedScenario, setSelectedScenario] = useState("dust-storm");
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [compare, setCompare] = useState(false);
  const [solsToRun, setSolsToRun] = useState(3);

  useEffect(() => {
    setData(colonyData);
    setState(initialState(colonyData));
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const actions = useMemo(() => state ? recommendActions(state) : [], [state]);
  const comparisons = useMemo(() => state && data ? makeScenarioComparison(state, data.scenarios) : [], [state, data]);
  const activeSystem = state?.systems.find((system) => system.id === selectedSystem);
  const activeScenario = data?.scenarios.find((scenario) => scenario.id === selectedScenario);

  if (!data || !state) {
    return <div className="loading-screen"><div className="loading-orbit"><div /></div><p>INITIALIZING ARES STATION</p><span>Loading colony telemetry…</span></div>;
  }

  const updateState = (next) => setState({ ...next, risk: calculateRisk(next.resources, next.systems) });
  const advance = () => {
    let next = state;
    for (let i = 0; i < solsToRun; i++) next = simulateSol(next);
    updateState(next);
    setToast(`Simulation advanced by ${solsToRun} Sol${solsToRun > 1 ? "s" : ""}.`);
  };
  const triggerScenario = () => {
    if (!activeScenario) return;
    updateState(applyScenario(state, activeScenario));
    setPage("overview");
    setToast(`${activeScenario.name} injected into simulation.`);
  };
  const reset = () => {
    localStorage.removeItem("mars-os-save-v1");
    const fresh = initialState({ ...data, colony: data.colony });
    setState(fresh);
    setPage("overview");
    setToast("Colony restored to baseline state.");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Orbit size={23} strokeWidth={1.8} /></div>
          <div><div className="brand-name">MARS<span>-OS</span></div><div className="brand-caption">SURVIVAL INTELLIGENCE</div></div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="mission-chip"><span className="live-dot" /><span>MISSION CONTROL</span><span className="chip-code">01</span></div>
        <div className="nav-label">OPERATIONS</div>
        <nav className="nav-list">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => { setPage(id); setMobileNav(false); }}>
              <Icon size={17} /><span>{label}</span>{page === id && <ChevronRight className="nav-chevron" size={15} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="crew-card">
          <div className="crew-orb"><Globe2 size={20} /></div>
          <div><div className="eyebrow">CURRENT SETTLEMENT</div><strong>ARES STATION</strong><span>Elysium Planitia, Mars</span></div>
          <span className="status-pip" />
        </div>
        <div className="sidebar-footer"><span className="footer-led" /> LOCAL SIMULATION <span>v1.0.0</span></div>
      </aside>

      {mobileNav && <button className="mobile-backdrop" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><button className="icon-button menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={19} /></button><span>ARES STATION</span><span className="crumb-slash">/</span><strong>{NAV.find((n) => n.id === page)?.label.toUpperCase()}</strong></div>
          <div className="topbar-right"><span className="earth-time"><span className="live-dot" /> SIMULATION ACTIVE</span><div className="topbar-divider" /><div className="sol-clock"><Clock3 size={15} /><span>SOL {state.sol.toString().padStart(3, "0")}</span></div><button className="avatar" title="Mission commander">SC</button></div>
        </header>

        <div className="content-wrap">
          {page === "overview" && <Overview state={state} actions={actions} setPage={setPage} onAdvance={advance} solsToRun={solsToRun} setSolsToRun={setSolsToRun} onReset={reset} />}
          {page === "colony" && <ColonyPage state={state} selectedSystem={selectedSystem} setSelectedSystem={setSelectedSystem} activeSystem={activeSystem} onRepair={(id) => { updateState(recoverSystem(state, id)); setToast("Maintenance action recorded."); }} />}
          {page === "life-support" && <LifeSupport state={state} onToggle={() => { updateState({ ...state, autonomy: !state.autonomy }); setToast(`Autonomous mode ${state.autonomy ? "disabled" : "enabled"}.`); }} onAdvance={advance} />}
          {page === "simulator" && <Simulator state={state} scenarios={data.scenarios} selectedScenario={selectedScenario} setSelectedScenario={setSelectedScenario} onTrigger={triggerScenario} comparisons={comparisons} compare={compare} setCompare={setCompare} onReset={reset} />}
          {page === "systems" && <SystemsPage state={state} onRepair={(id) => { updateState(recoverSystem(state, id)); setToast("Maintenance action recorded."); }} />}
          {page === "logs" && <LogsPage logs={state.logs} onClear={() => { setState({ ...state, logs: [] }); setToast("Event log cleared."); }} />}
        </div>
        <footer className="app-footer"><span> MARS-OS <span className="muted">/ SURVIVAL INTELLIGENCE</span></span><span>SIMULATED DATA · NOT FOR REAL MISSION OPERATIONS</span><span>© ARES RESEARCH DIVISION</span></footer>
      </main>
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="heading-action">{action}</div>}</div>;
}

function Panel({ title, subtitle, icon: Icon, action, children, className = "" }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div className="panel-title-wrap">{Icon && <div className="panel-icon"><Icon size={16} /></div>}<div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>{action}</div>{children}</section>;
}

function MetricCard({ label, value, unit, note, icon: Icon, tone = "blue", trend }) {
  return <div className={`metric-card tone-${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={17} /></span></div><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-bottom">{trend && <span className={`trend ${trend > 0 ? "up" : "down"}`}>{trend > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {Math.abs(trend)}%</span>}<span>{note}</span></div><div className="metric-sheen" /></div>;
}

function Overview({ state, actions, setPage, onAdvance, solsToRun, setSolsToRun, onReset }) {
  const critical = state.resources.filter((r) => resourceStatus(r) === "critical").length;
  const warning = state.resources.filter((r) => resourceStatus(r) === "warning").length;
  return <>
    <PageHeading eyebrow="COMMAND CENTER / LIVE SIMULATION" title="Mission overview" description="A systems-level view of colony health, resources, and operational risk." action={<button className="button button-primary" onClick={onAdvance}><Play size={15} fill="currentColor" /> Advance simulation</button>} />
    <div className="mission-banner">
      <div className="banner-sky"><div className="mars-disc" /><div className="banner-grid" /><div className="banner-star star-a" /><div className="banner-star star-b" /><div className="banner-star star-c" /><div className="banner-horizon" /></div>
      <div className="banner-content"><div className="banner-tag"><span className="live-dot" /> PRIMARY SETTLEMENT · ONLINE</div><h2>ARES <span>STATION</span></h2><p>First-generation human research habitat<br />Elysium Planitia, Mars · 4.5° N, 135.9° E</p><div className="banner-stats"><div><span>MISSION SOL</span><strong>{state.sol}</strong></div><div><span>CREW ON SITE</span><strong>{state.crew}<small> personnel</small></strong></div><div><span>MISSION ELAPSED</span><strong>{Math.round(state.sol / state.missionDuration * 100)}<small>%</small></strong></div></div></div>
      <div className="banner-seal"><Orbit size={38} /><span>ARES<br />DIVISION</span></div>
    </div>
    <div className="section-kicker"><span>COLONY TELEMETRY</span><span>UPDATED ON SOL {state.sol}</span></div>
    <div className="metrics-grid">
      <MetricCard label="Life-support health" value={`${Math.round(state.resources.filter((r) => resourceStatus(r) === "nominal").length / state.resources.length * 100)}%`} unit="" note="Resource stability" icon={HeartPulse} tone="mint" trend={2} />
      <MetricCard label="Colony risk index" value={state.risk} unit="/100" note={state.risk > 55 ? "Intervention required" : "Operational risk"} icon={ShieldAlert} tone="amber" trend={-3} />
      <MetricCard label="Systems online" value={`${state.systems.filter((s) => s.health >= 60).length}/${state.systems.length}`} unit="" note="Subsystem availability" icon={Cpu} tone="violet" />
      <MetricCard label="Active alerts" value={critical + warning + state.logs.filter((l) => l.type === "critical").length} unit="" note={`${critical} critical resource${critical === 1 ? "" : "s"}`} icon={AlertTriangle} tone="rose" />
    </div>
    <div className="overview-grid">
      <Panel title="Life-support reserves" subtitle="Available resource capacity" icon={Waves} action={<button className="text-button" onClick={() => setPage("life-support")}>View details <ChevronRight size={14} /></button>}>
        <div className="resource-list">{state.resources.map((resource) => <ResourceRow key={resource.id} resource={resource} crew={state.crew} />)}</div>
        <div className="panel-note"><span className="note-dot" /><span>Forecasts use current production and consumption rates. Values are simulated.</span></div>
      </Panel>
      <Panel title="Survival decision engine" subtitle="Recommended operational actions" icon={BrainCircuit} action={<span className="ai-pill"><span /> RULE ENGINE</span>}>
        <div className="recommendation-list">{actions.map((item, index) => <div className="recommendation" key={item.title}><div className={`priority-dot priority-${item.priority.toLowerCase()}`} /><div className="recommendation-copy"><div><span className="recommendation-title">{item.title}</span><span className="priority-label">{item.priority}</span></div><p>{item.detail}</p></div><span className="rec-number">{String(index + 1).padStart(2, "0")}</span></div>)}</div>
        <button className="button button-secondary full-button" onClick={() => setPage("life-support")}><BrainCircuit size={15} /> Open resource controls</button>
      </Panel>
    </div>
    <div className="lower-grid">
      <Panel title="Colony infrastructure" subtitle="Subsystem status overview" icon={Layers3} action={<button className="text-button" onClick={() => setPage("colony")}>Open digital twin <ChevronRight size={14} /></button>}>
        <div className="system-mini-grid">{state.systems.map((system) => <button className="system-mini" key={system.id} onClick={() => setPage("colony")}><span className={`system-status-dot ${system.health < 70 ? "is-warning" : ""}`} /><span className="system-mini-name">{system.name}</span><strong>{system.health}%</strong><div className="mini-track"><span style={{ width: `${system.health}%` }} /></div></button>)}</div>
      </Panel>
      <Panel title="Recent mission events" subtitle="Latest system activity" icon={Activity} action={<button className="text-button" onClick={() => setPage("logs")}>Full log <ChevronRight size={14} /></button>}>
        <div className="event-list compact">{state.logs.slice(0, 3).map((log) => <EventRow key={log.id} log={log} />)}</div>
      </Panel>
    </div>
    <div className="control-strip"><div className="control-strip-copy"><div className="control-symbol"><Clock3 size={18} /></div><div><strong>Time-step controls</strong><span>Advance the colony simulation by one or more Martian sols.</span></div></div><div className="stepper"><button onClick={() => setSolsToRun(Math.max(1, solsToRun - 1))} aria-label="Decrease sols">−</button><strong>{solsToRun} <small>SOL{solsToRun > 1 ? "S" : ""}</small></strong><button onClick={() => setSolsToRun(Math.min(30, solsToRun + 1))} aria-label="Increase sols">+</button></div><button className="button button-primary" onClick={onAdvance}><Play size={14} fill="currentColor" /> Run steps</button><button className="button button-ghost" onClick={onReset}><RotateCcw size={14} /> Reset</button></div>
  </>;
}

function ResourceRow({ resource, crew }) {
  const status = resourceStatus(resource);
  const days = estimateDays(resource, crew);
  const Icon = ICONS[resource.id] || Activity;
  return <div className="resource-row"><div className={`resource-icon resource-${resource.id}`}><Icon size={17} /></div><div className="resource-main"><div className="resource-title-line"><strong>{resource.name}</strong><span className={`status-text status-${status}`}>{status}</span></div><div className="resource-track"><span style={{ width: `${resource.value}%`, background: resource.color }} /><i style={{ left: `${resource.critical}%` }} /></div><div className="resource-meta"><span>{resource.production.toFixed(1)} produced / sol</span><span>{resource.consumption.toFixed(1)} consumed / sol</span></div></div><div className="resource-amount"><strong>{Math.round(resource.value)}<small>%</small></strong><span>~{days} sols</span></div></div>;
}

function EventRow({ log }) {
  return <div className="event-row"><div className={`event-icon event-${log.type}`}>{log.type === "critical" ? <AlertTriangle size={14} /> : log.type === "warning" ? <AlertTriangle size={14} /> : log.type === "success" ? <Check size={14} /> : <Activity size={14} />}</div><div className="event-copy"><strong>{log.title}</strong><span>{log.message}</span></div><time>{log.time}</time></div>;
}

function ColonyPage({ state, selectedSystem, setSelectedSystem, activeSystem, onRepair }) {
  return <>
    <PageHeading eyebrow="SPATIAL OPERATIONS / DIGITAL TWIN" title="Colony digital twin" description="Select a facility on the schematic to inspect health, purpose, and maintenance actions." />
    <div className="colony-layout">
      <Panel title="ARES STATION · SURFACE MAP" subtitle="Schematic visualization · not to scale" icon={Globe2} className="colony-map-panel">
        <div className="colony-map">
          <div className="map-stars" /><div className="map-mountains mountain-one" /><div className="map-mountains mountain-two" />
          <svg className="map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M24 50 L50 27 L76 47 L79 76 L49 70 L24 50 M50 27 L49 70 M24 50 L79 76" /></svg>
          {state.systems.map((system) => <button key={system.id} className={`map-building building-${system.id} ${selectedSystem === system.id ? "selected" : ""}`} style={{ left: `${system.x}%`, top: `${system.y}%` }} onClick={() => setSelectedSystem(system.id)}><span className="building-halo" /><span className="building-art">{system.id === "habitat" ? <House size={25} /> : system.id === "greenhouse" ? <Sprout size={25} /> : system.id === "power" ? <Sun size={25} /> : system.id === "water" ? <Droplets size={25} /> : <Radio size={25} />}</span><span className="building-label">{system.name}</span><span className={`building-dot ${system.health < 70 ? "warning" : ""}`} /></button>)}
          <div className="map-coordinate coordinate-a">04° 30′ N</div><div className="map-coordinate coordinate-b">135° 54′ E</div><div className="map-map-label">ELYSIUM PLANITIA <span>· MARS</span></div>
          <div className="map-compass"><Orbit size={22} /><span>N</span></div>
          <div className="map-scale"><span /> 100 m <span /></div>
        </div>
        <div className="map-legend"><span><i className="legend-nominal" /> Nominal system</span><span><i className="legend-warning" /> Needs attention</span><span><i className="legend-selected" /> Selected facility</span></div>
      </Panel>
      <div className="system-detail-column">
        <Panel title="Facility diagnostics" subtitle="Selected subsystem" icon={Activity}>
          {activeSystem && <div className="facility-detail"><div className="facility-illustration">{activeSystem.id === "habitat" ? <House size={36} /> : activeSystem.id === "greenhouse" ? <Sprout size={36} /> : activeSystem.id === "power" ? <Sun size={36} /> : activeSystem.id === "water" ? <Droplets size={36} /> : <Radio size={36} />}<span className="facility-pulse" /></div><div className="eyebrow">{activeSystem.type}</div><h3>{activeSystem.name}</h3><p>{activeSystem.description}</p><div className="facility-health"><div><span>Structural health</span><strong>{activeSystem.health}%</strong></div><div className="health-track"><span style={{ width: `${activeSystem.health}%` }} /></div></div><div className="detail-stat-list"><div><span>Operational state</span><strong className={activeSystem.health < 70 ? "text-warning" : "text-success"}>{activeSystem.health < 70 ? "Attention required" : "Operational"}</strong></div><div><span>Maintenance cycle</span><strong>{activeSystem.health < 75 ? "Due now" : "Routine"}</strong></div><div><span>Telemetry source</span><strong>SIM / LOCAL</strong></div></div><button className="button button-primary full-button" onClick={() => onRepair(activeSystem.id)}><Wrench size={15} /> Run maintenance (+20%)</button></div>}
        </Panel>
        <Panel title="Facility index" subtitle={`${state.systems.length} registered subsystems`} icon={Layers3}>
          <div className="facility-index">{state.systems.map((system) => <button key={system.id} className={`facility-index-row ${selectedSystem === system.id ? "chosen" : ""}`} onClick={() => setSelectedSystem(system.id)}><span className="index-indicator" /><span>{system.name}</span><strong>{system.health}%</strong><ChevronRight size={14} /></button>)}</div>
        </Panel>
      </div>
    </div>
  </>;
}

function LifeSupport({ state, onToggle, onAdvance }) {
  return <>
    <PageHeading eyebrow="ENVIRONMENTAL CONTROL / ECLSS" title="Life-support management" description="Monitor essential reserves and control the rule-based autonomous conservation policy." action={<button className="button button-primary" onClick={onAdvance}><Play size={14} fill="currentColor" /> Advance one Sol</button>} />
    <div className="life-hero"><div className="life-hero-icon"><HeartPulse size={25} /></div><div className="life-hero-copy"><span className="eyebrow">ENVIRONMENTAL CONTROL & LIFE SUPPORT</span><h2>Keep the crew alive. Keep the colony running.</h2><p>Current reserve estimates use configured production and consumption rates. Forecasts are simplified planning indicators, not validated life-support engineering models.</p></div><div className="autonomy-switch-wrap"><span>Autonomous conservation</span><button className={`switch ${state.autonomy ? "switch-on" : ""}`} role="switch" aria-checked={state.autonomy} onClick={onToggle}><span /></button><strong>{state.autonomy ? "ENABLED" : "MANUAL"}</strong></div></div>
    <div className="life-resource-grid">{state.resources.map((resource) => { const Icon = ICONS[resource.id] || Activity; const status = resourceStatus(resource); return <div className="life-resource-card" key={resource.id}><div className="life-card-head"><div className={`resource-icon resource-${resource.id}`}><Icon size={19} /></div><span className={`status-badge status-${status}`}>{status}</span></div><div className="eyebrow">{resource.short}</div><h3>{resource.name}</h3><div className="life-big-value">{Math.round(resource.value)}<small>%</small></div><div className="life-track"><span style={{ width: `${resource.value}%`, background: resource.color }} /><i style={{ left: `${resource.critical}%` }} /></div><div className="life-card-stats"><div><span>Production</span><strong>{resource.production.toFixed(1)}<small>/sol</small></strong></div><div><span>Consumption</span><strong>{resource.consumption.toFixed(1)}<small>/sol</small></strong></div></div><div className="reserve-estimate"><Clock3 size={14} /><span>Estimated reserve window</span><strong>{estimateDays(resource, state.crew)} sols</strong></div><div className="critical-threshold"><span>Critical threshold</span><strong>{resource.critical}%</strong></div></div>; })}</div>
    <div className="overview-grid life-bottom-grid"><Panel title="Autonomous policy rules" subtitle="Actions evaluated on each simulation step" icon={BrainCircuit}><div className="policy-list"><div><span className="policy-number">01</span><div><strong>Protect critical reserves</strong><p>When a resource nears its critical threshold, simulated consumption is reduced.</p></div><span className="policy-active">ACTIVE</span></div><div><span className="policy-number">02</span><div><strong>Preserve energy reserve</strong><p>Energy conservation receives a larger adjustment during low-power conditions.</p></div><span className="policy-active">ACTIVE</span></div><div><span className="policy-number">03</span><div><strong>Escalate risk alerts</strong><p>Resource and subsystem conditions feed the colony risk index.</p></div><span className="policy-active">ACTIVE</span></div></div></Panel><Panel title="Crew demand model" subtitle="Configured planning assumptions" icon={UsersIcon}><div className="crew-demand"><div><span>Crew on site</span><strong>{state.crew} <small>people</small></strong></div><div><span>Colony clock</span><strong>Sol {state.sol}</strong></div><div><span>Resource data</span><strong>SIMULATED</strong></div><p>Daily demand values are illustrative inputs. Change the JSON seed data to test different crew sizes and reserve assumptions.</p></div></Panel></div>
  </>;
}

function UsersIcon(props) { return <HeartPulse {...props} />; }

function Simulator({ state, scenarios, selectedScenario, setSelectedScenario, onTrigger, comparisons, compare, setCompare, onReset }) {
  const scenario = scenarios.find((s) => s.id === selectedScenario);
  return <>
    <PageHeading eyebrow="WHAT-IF ANALYSIS / CONTROLLED EVENTS" title="Scenario laboratory" description="Inject a simulated incident, observe its impact, and compare alternative risk outcomes." action={<button className="button button-ghost" onClick={onReset}><RotateCcw size={14} /> Reset baseline</button>} />
    <div className="sim-intro"><div className="sim-intro-icon"><FlaskConical size={23} /></div><div><h2>Stress-test the settlement</h2><p>Scenarios apply deterministic changes to the current simulated state. Run a baseline reset to return to the initial values.</p></div><div className="sim-mode"><span /> WHAT-IF ENGINE</div></div>
    <div className="scenario-layout"><Panel title="Incident library" subtitle="Choose a simulated event" icon={CloudLightning}><div className="scenario-list">{scenarios.map((item) => <button key={item.id} className={`scenario-option ${selectedScenario === item.id ? "scenario-selected" : ""}`} onClick={() => setSelectedScenario(item.id)}><span className={`scenario-symbol severity-${item.severity}`}><CloudLightning size={18} /></span><span className="scenario-option-copy"><strong>{item.name}</strong><span>{item.description}</span></span><span className={`severity-pill severity-text-${item.severity}`}>{item.severity}</span><ChevronRight size={15} /></button>)}</div></Panel>
      <Panel title="Incident briefing" subtitle="Projected effects on the current colony" icon={Target}>{scenario && <div className="briefing"><div className="briefing-top"><span className={`severity-pill severity-text-${scenario.severity}`}>{scenario.severity} SEVERITY</span><span className="briefing-duration"><Clock3 size={13} /> {scenario.duration} sols (assumed)</span></div><h3>{scenario.name}</h3><p>{scenario.description}</p><div className="impact-list"><div className="impact-header"><span>RESOURCE</span><span>DELTA</span><span>PROJECTED</span></div>{state.resources.filter((r) => scenario.effects[r.id] !== undefined).map((resource) => <div className="impact-row" key={resource.id}><span>{resource.name}</span><strong className={scenario.effects[resource.id] < 0 ? "text-danger" : "text-success"}>{scenario.effects[resource.id] > 0 ? "+" : ""}{scenario.effects[resource.id]}%</strong><strong>{Math.max(0, Math.min(100, resource.value + scenario.effects[resource.id]))}%</strong></div>)}</div><div className="briefing-warning"><AlertTriangle size={15} /><span>Injecting this event changes your current simulation state. Use reset to restore the baseline.</span></div><button className="button button-danger full-button" onClick={onTrigger}><CloudLightning size={15} /> Inject scenario</button></div>}</Panel></div>
    <Panel title="Scenario comparison" subtitle="Compare projected risk from the current state" icon={Activity} action={<button className={`switch ${compare ? "switch-on" : ""}`} role="switch" aria-checked={compare} onClick={() => setCompare(!compare)}><span /></button>}>
      {compare ? <div className="comparison-table"><div className="comparison-head"><span>SCENARIO</span><span>PROJECTED RISK</span><span>LOWEST RESERVE</span><span>ASSESSMENT</span></div>{comparisons.map((item) => <div className="comparison-row" key={item.id}><strong>{item.name}</strong><div className="comparison-risk"><div className="mini-track"><span style={{ width: `${item.projectedRisk}%`, background: item.projectedRisk > 60 ? "var(--red)" : item.projectedRisk > 35 ? "var(--amber)" : "var(--mint)" }} /></div><strong>{item.projectedRisk}/100</strong></div><span>{item.lowestResource.name} · {Math.round(item.lowestResource.value)}%</span><span className={`assessment ${item.projectedRisk > 60 ? "text-danger" : item.projectedRisk > 35 ? "text-warning" : "text-success"}`}>{item.projectedRisk > 60 ? "HIGH RISK" : item.projectedRisk > 35 ? "MONITOR" : "MANAGEABLE"}</span></div>)}</div> : <div className="comparison-placeholder"><Activity size={22} /><strong>Scenario comparison is ready</strong><span>Enable comparison to rank all incidents by projected colony risk.</span><button className="button button-secondary" onClick={() => setCompare(true)}>Compare scenarios</button></div>}
      <div className="panel-note"><span className="note-dot" /><span>Risk scores are illustrative, rule-based indicators. They are not validated safety predictions.</span></div>
    </Panel>
  </>;
}

function SystemsPage({ state, onRepair }) {
  return <>
    <PageHeading eyebrow="ENGINEERING / MAINTENANCE" title="Systems & maintenance" description="Review subsystem integrity and perform simulated maintenance actions." />
    <div className="system-cards-grid">{state.systems.map((system) => <div className="maintenance-card" key={system.id}><div className="maintenance-top"><div className="maintenance-icon">{system.id === "habitat" ? <House size={19} /> : system.id === "greenhouse" ? <Sprout size={19} /> : system.id === "power" ? <Sun size={19} /> : system.id === "water" ? <Droplets size={19} /> : <Radio size={19} />}</div><span className={`status-badge ${system.health < 70 ? "status-critical" : system.health < 85 ? "status-warning" : "status-nominal"}`}>{system.health < 70 ? "attention" : system.health < 85 ? "monitor" : "nominal"}</span></div><div className="eyebrow">{system.type}</div><h3>{system.name}</h3><p>{system.description}</p><div className="maintenance-health"><div><span>System health</span><strong>{system.health}%</strong></div><div className="health-track"><span style={{ width: `${system.health}%` }} /></div></div><div className="maintenance-footer"><span><Wrench size={14} /> {system.health < 75 ? "Maintenance due" : "Routine inspection"}</span><button className="button button-secondary" onClick={() => onRepair(system.id)}>Repair +20%</button></div></div>)}</div>
    <div className="maintenance-note"><Shield size={18} /><div><strong>Maintenance simulation</strong><p>Repairs increase the selected system's health by 20 percentage points, up to 100%. This is a demonstration mechanic, not a physical engineering model.</p></div></div>
  </>;
}

function LogsPage({ logs, onClear }) {
  const [filter, setFilter] = useState("all");
  const filtered = logs.filter((log) => filter === "all" || log.type === filter);
  return <>
    <PageHeading eyebrow="TELEMETRY / AUDIT TRAIL" title="Mission event log" description="Review simulated alerts, maintenance actions, and time-step events." action={<button className="button button-ghost" onClick={onClear}><RotateCcw size={14} /> Clear log</button>} />
    <Panel title="Event history" subtitle={`${filtered.length} entries shown`} icon={History} action={<select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All events</option><option value="critical">Critical</option><option value="warning">Warnings</option><option value="success">Success</option><option value="info">Information</option></select>}>
      {filtered.length ? <div className="full-event-list">{filtered.map((log) => <div className="full-event" key={log.id}><div className={`event-icon event-${log.type}`}>{log.type === "critical" || log.type === "warning" ? <AlertTriangle size={15} /> : log.type === "success" ? <Check size={15} /> : <Activity size={15} />}</div><div className="full-event-copy"><div><strong>{log.title}</strong><span className={`log-type log-${log.type}`}>{log.type}</span></div><p>{log.message}</p></div><div className="event-meta"><span>SOL {log.sol}</span><time>{log.time}</time></div></div>)}</div> : <div className="empty-state"><History size={28} /><strong>No events in this view</strong><span>Try another filter or advance the simulation.</span></div>}
    </Panel>
  </>;
}

export default App;