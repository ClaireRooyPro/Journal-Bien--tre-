import { useState, useEffect, useRef } from "react";

// ── Constants ──────────────────────────────────────────────────────────────
const PHASES = ["Menstruelle", "Folliculaire", "Ovulatoire", "Lutéale"];
const SLEEP_QUALITY = ["😴 Très bien", "🙂 Bien", "😐 Moyen", "😞 Mauvais"];
const HUNGER_LEVELS = Array.from({ length: 10 }, (_, i) => String(i + 1));
const MOODS = ["😊 Sereine", "😌 Détendue", "😐 Neutre", "😟 Stressée", "😢 Émotionnelle", "😤 Irritable"];
const CONTEXTS = ["🏠 Seule", "👨‍👩‍👧 En famille", "👥 Entre amis", "💼 Au travail", "🏃 En déplacement", "📱 Devant écran"];
const SPORT_TYPES = ["🏃 Course", "🚴 Vélo", "🏊 Natation", "🧘 Yoga", "🏋️ Musculation", "🤸 Pilates", "💃 Danse", "🥊 Boxe", "🚶 Marche", "⛷️ Ski", "🧗 Escalade", "Autre"];
const SPORT_INTENSITY = ["🟢 Légère", "🟡 Modérée", "🔴 Intense"];
const MEDITATION_TYPES = ["🌬️ Respiration", "🧘 Pleine conscience", "💤 Body scan", "🎵 Guidée", "📿 Mantra", "🌊 Visualisation", "Autre"];
const HYDRATION_GOAL = 8; // glasses

const STORAGE_KEY = "wellness-journal-v2";
const MEASUREMENTS_KEY = "wellness-measurements";

const TABS = [
  { id: "food", icon: "🍽️", label: "Alimentation" },
  { id: "hydration", icon: "💧", label: "Hydratation" },
  { id: "sport", icon: "🏃", label: "Sport" },
  { id: "meditation", icon: "🧘", label: "Méditation" },
  { id: "wellbeing", icon: "💫", label: "Bien-être" },
  { id: "measurements", icon: "📏", label: "Mensurations" },
  { id: "history", icon: "📅", label: "Historique" },
];

// ── Storage ────────────────────────────────────────────────────────────────
function loadData(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}
function todayKey() { return new Date().toISOString().slice(0, 10); }
function formatDate(key) {
  const [y, m, d] = key.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ── Empty templates ────────────────────────────────────────────────────────
const emptyMeal = () => ({ id: Date.now() + Math.random(), time: "", name: "", proteins: "", carbs: "", fats: "", hungerBefore: "", satietyAfter: "", sensations: "" });
const emptyWorkout = () => ({ id: Date.now() + Math.random(), type: "", duration: "", intensity: "", calories: "", notes: "" });
const emptyMeditation = () => ({ id: Date.now() + Math.random(), type: "", duration: "", feeling: "", notes: "" });
const emptyDay = () => ({ meals: [], workouts: [], meditations: [], waterGlasses: 0, sleep: "", sleepHours: "", cyclePhase: "", cycleDay: "", context: "", mood: "", notes: "" });

// ── Theme colors ───────────────────────────────────────────────────────────
const C = {
  bg: "linear-gradient(160deg, #fdf6f0 0%, #fef0e8 40%, #fce8f0 100%)",
  card: "rgba(255,255,255,0.82)",
  border: "rgba(210,160,130,0.28)",
  primary: "#8b3a3a",
  accent: "#c4607a",
  muted: "#b07060",
  text: "#3d2b1f",
  food: "#c4607a",
  water: "#4a9eba",
  sport: "#6a9a5a",
  meditation: "#7a6aaa",
  wellbeing: "#c47a3a",
  measurements: "#8a6a4a",
};

// ══════════════════════════════════════════════════════════════════════════
export default function WellnessJournal() {
  const [allData, setAllData] = useState(() => loadData(STORAGE_KEY));
  const [measurements, setMeasurements] = useState(() => loadData(MEASUREMENTS_KEY));
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [activeTab, setActiveTab] = useState("food");
  const [expandedItem, setExpandedItem] = useState(null);
  const [showAdd, setShowAdd] = useState({ meal: false, workout: false, meditation: false, measurement: false });
  const [newMeal, setNewMeal] = useState(emptyMeal());
  const [newWorkout, setNewWorkout] = useState(emptyWorkout());
  const [newMeditation, setNewMeditation] = useState(emptyMeditation());
  const [newMeasurement, setNewMeasurement] = useState({ weight: "", waist: "", hips: "", bust: "", thighs: "", arms: "", notes: "" });
  const [meditationTimer, setMeditationTimer] = useState({ running: false, seconds: 0, target: 0 });
  const timerRef = useRef(null);

  const dayData = allData[selectedDate] || emptyDay();

  function updateDay(updates) {
    const updated = { ...allData, [selectedDate]: { ...dayData, ...updates } };
    setAllData(updated); saveData(STORAGE_KEY, updated);
  }

  // Meals
  function addMeal() {
    if (!newMeal.name.trim()) return;
    updateDay({ meals: [...(dayData.meals || []), { ...newMeal, id: Date.now() }] });
    setNewMeal(emptyMeal()); setShowAdd(p => ({ ...p, meal: false }));
  }
  function removeMeal(id) { updateDay({ meals: dayData.meals.filter(m => m.id !== id) }); }
  function updateMeal(id, f, v) { updateDay({ meals: dayData.meals.map(m => m.id === id ? { ...m, [f]: v } : m) }); }

  // Workouts
  function addWorkout() {
    if (!newWorkout.type) return;
    updateDay({ workouts: [...(dayData.workouts || []), { ...newWorkout, id: Date.now() }] });
    setNewWorkout(emptyWorkout()); setShowAdd(p => ({ ...p, workout: false }));
  }
  function removeWorkout(id) { updateDay({ workouts: dayData.workouts.filter(w => w.id !== id) }); }

  // Meditations
  function addMeditation(m = newMeditation) {
    if (!m.type && !m.duration) return;
    updateDay({ meditations: [...(dayData.meditations || []), { ...m, id: Date.now() }] });
    setNewMeditation(emptyMeditation()); setShowAdd(p => ({ ...p, meditation: false }));
  }
  function removeMeditation(id) { updateDay({ meditations: dayData.meditations.filter(m => m.id !== id) }); }

  // Hydration
  function setWater(n) { updateDay({ waterGlasses: Math.max(0, Math.min(20, n)) }); }

  // Measurements
  function saveMeasurement() {
    const entry = { ...newMeasurement, date: selectedDate };
    const updated = { ...measurements, [selectedDate]: entry };
    setMeasurements(updated); saveData(MEASUREMENTS_KEY, updated);
    setNewMeasurement({ weight: "", waist: "", hips: "", bust: "", thighs: "", arms: "", notes: "" });
    setShowAdd(p => ({ ...p, measurement: false }));
  }

  // Timer
  function startTimer(minutes) {
    if (timerRef.current) clearInterval(timerRef.current);
    const target = minutes * 60;
    setMeditationTimer({ running: true, seconds: 0, target });
    timerRef.current = setInterval(() => {
      setMeditationTimer(prev => {
        if (prev.seconds >= target - 1) {
          clearInterval(timerRef.current);
          const completed = { ...newMeditation, duration: String(minutes), type: newMeditation.type || "🌬️ Respiration" };
          addMeditation(completed);
          return { running: false, seconds: target, target };
        }
        return { ...prev, seconds: prev.seconds + 1 };
      });
    }, 1000);
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setMeditationTimer({ running: false, seconds: 0, target: 0 });
  }
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const totalMacros = (dayData.meals || []).reduce((a, m) => ({
    p: a.p + (parseFloat(m.proteins) || 0), g: a.g + (parseFloat(m.carbs) || 0), l: a.l + (parseFloat(m.fats) || 0),
  }), { p: 0, g: 0, l: 0 });

  const totalSportMin = (dayData.workouts || []).reduce((a, w) => a + (parseInt(w.duration) || 0), 0);
  const totalMeditationMin = (dayData.meditations || []).reduce((a, m) => a + (parseInt(m.duration) || 0), 0);
  const water = dayData.waterGlasses || 0;

  // ── History dates ──────────────────────────────────────────────────────
  const historyDates = Object.keys(allData).sort().reverse().slice(0, 30);
  const measurementDates = Object.keys(measurements).sort().reverse().slice(0, 10);

  // ── Render ─────────────────────────────────────────────────────────────
  const tabColor = { food: C.food, hydration: C.water, sport: C.sport, meditation: C.meditation, wellbeing: C.wellbeing, measurements: C.measurements, history: C.primary };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Georgia', serif", color: C.text }}>

      {/* ── Header ── */}
      <div style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.border}`, padding: "14px 20px", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: "bold", color: C.primary }}>🌸 Mon Journal Bien-être</div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: "2px", textTransform: "uppercase" }}>Corps · Esprit · Énergie</div>
            </div>
            {/* Date nav */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <NavBtn onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().slice(0, 10)); }}>‹</NavBtn>
              <div style={{ fontSize: 12, color: C.primary, fontWeight: "bold", minWidth: 80, textAlign: "center" }}>
                {selectedDate === todayKey() ? "Aujourd'hui" : selectedDate}
              </div>
              <NavBtn disabled={selectedDate >= todayKey()} onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); const n = d.toISOString().slice(0, 10); if (n <= todayKey()) setSelectedDate(n); }}>›</NavBtn>
            </div>
          </div>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: "5px 11px", borderRadius: 20, border: "none", cursor: "pointer", whiteSpace: "nowrap",
                fontSize: 12, fontFamily: "inherit", transition: "all 0.18s",
                background: activeTab === t.id ? (tabColor[t.id] || C.primary) : "rgba(0,0,0,0.04)",
                color: activeTab === t.id ? "white" : C.muted,
                fontWeight: activeTab === t.id ? "bold" : "normal",
              }}>{t.icon} {t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Day summary strip ── */}
      {activeTab !== "history" && activeTab !== "measurements" && (
        <div style={{ background: "rgba(255,255,255,0.55)", borderBottom: `1px solid ${C.border}`, padding: "8px 20px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 16, overflowX: "auto" }}>
            {[
              { icon: "🥩", val: `${totalMacros.p.toFixed(0)}g`, label: "Prot.", color: C.food },
              { icon: "🌾", val: `${totalMacros.g.toFixed(0)}g`, label: "Gluc.", color: "#d4a060" },
              { icon: "🥑", val: `${totalMacros.l.toFixed(0)}g`, label: "Lip.", color: "#80a860" },
              { icon: "💧", val: `${water}/${HYDRATION_GOAL}`, label: "Verres", color: C.water },
              { icon: "🏃", val: `${totalSportMin}min`, label: "Sport", color: C.sport },
              { icon: "🧘", val: `${totalMeditationMin}min`, label: "Médit.", color: C.meditation },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", minWidth: 48 }}>
                <div style={{ fontSize: 13, fontWeight: "bold", color: s.color }}>{s.icon} {s.val}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 14px" }}>

        {/* ════ FOOD TAB ════ */}
        {activeTab === "food" && (
          <>
            <Section title="🍽️ Repas" color={C.food}>
              {(dayData.meals || []).map(meal => (
                <Card key={meal.id} onClick={() => setExpandedItem(expandedItem === meal.id ? null : meal.id)}
                  header={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "bold", color: "#5a2a1a" }}>{meal.name || "Repas"} {meal.time && <span style={{ fontSize: 11, color: C.muted, fontWeight: "normal" }}>· {meal.time}</span>}</span>
                      <div style={{ display: "flex", gap: 5 }}>
                        {meal.proteins && <Pill color={C.food}>{meal.proteins}g P</Pill>}
                        {meal.carbs && <Pill color="#d4a060">{meal.carbs}g G</Pill>}
                        {meal.fats && <Pill color="#80a860">{meal.fats}g L</Pill>}
                        <ChevronIcon open={expandedItem === meal.id} />
                      </div>
                    </div>
                  }>
                  {expandedItem === meal.id && (
                    <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                      <Grid2>
                        <Field label="Nom" value={meal.name} onChange={v => updateMeal(meal.id, "name", v)} />
                        <Field label="Heure" type="time" value={meal.time} onChange={v => updateMeal(meal.id, "time", v)} />
                        <Field label="Protéines (g)" type="number" value={meal.proteins} onChange={v => updateMeal(meal.id, "proteins", v)} />
                        <Field label="Glucides (g)" type="number" value={meal.carbs} onChange={v => updateMeal(meal.id, "carbs", v)} />
                        <Field label="Lipides (g)" type="number" value={meal.fats} onChange={v => updateMeal(meal.id, "fats", v)} />
                        <div />
                        <SelectField label="Faim avant /10" value={meal.hungerBefore} onChange={v => updateMeal(meal.id, "hungerBefore", v)} options={HUNGER_LEVELS} />
                        <SelectField label="Satiété après /10" value={meal.satietyAfter} onChange={v => updateMeal(meal.id, "satietyAfter", v)} options={HUNGER_LEVELS} />
                      </Grid2>
                      <TextArea label="Sensations, envies, remarques" value={meal.sensations} onChange={v => updateMeal(meal.id, "sensations", v)} />
                      <DeleteBtn onClick={() => removeMeal(meal.id)} />
                    </div>
                  )}
                </Card>
              ))}
              {showAdd.meal ? (
                <AddForm title="Nouveau repas" onSave={addMeal} onCancel={() => { setShowAdd(p => ({ ...p, meal: false })); setNewMeal(emptyMeal()); }}>
                  <Grid2>
                    <Field label="Nom du repas" value={newMeal.name} onChange={v => setNewMeal(p => ({ ...p, name: v }))} />
                    <Field label="Heure" type="time" value={newMeal.time} onChange={v => setNewMeal(p => ({ ...p, time: v }))} />
                    <Field label="Protéines (g)" type="number" value={newMeal.proteins} onChange={v => setNewMeal(p => ({ ...p, proteins: v }))} />
                    <Field label="Glucides (g)" type="number" value={newMeal.carbs} onChange={v => setNewMeal(p => ({ ...p, carbs: v }))} />
                    <Field label="Lipides (g)" type="number" value={newMeal.fats} onChange={v => setNewMeal(p => ({ ...p, fats: v }))} />
                    <div />
                    <SelectField label="Faim avant /10" value={newMeal.hungerBefore} onChange={v => setNewMeal(p => ({ ...p, hungerBefore: v }))} options={HUNGER_LEVELS} />
                    <SelectField label="Satiété après /10" value={newMeal.satietyAfter} onChange={v => setNewMeal(p => ({ ...p, satietyAfter: v }))} options={HUNGER_LEVELS} />
                  </Grid2>
                  <TextArea label="Sensations" value={newMeal.sensations} onChange={v => setNewMeal(p => ({ ...p, sensations: v }))} />
                </AddForm>
              ) : <AddBtn color={C.food} onClick={() => setShowAdd(p => ({ ...p, meal: true }))}>+ Ajouter un repas</AddBtn>}
            </Section>
          </>
        )}

        {/* ════ HYDRATION TAB ════ */}
        {activeTab === "hydration" && (
          <Section title="💧 Hydratation" color={C.water}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
              {/* Water goal visual */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 42, fontWeight: "bold", color: C.water }}>{water}</div>
                <div style={{ fontSize: 14, color: C.muted }}>verres sur {HYDRATION_GOAL} recommandés</div>
                <div style={{ margin: "12px auto", maxWidth: 300, height: 10, background: "#e8f0f8", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (water / HYDRATION_GOAL) * 100)}%`, height: "100%", background: `linear-gradient(90deg, #4a9eba, #7abfda)`, borderRadius: 10, transition: "width 0.4s" }} />
                </div>
                <div style={{ fontSize: 12, color: water >= HYDRATION_GOAL ? C.sport : C.muted }}>
                  {water >= HYDRATION_GOAL ? "✅ Objectif atteint !" : `${HYDRATION_GOAL - water} verre${HYDRATION_GOAL - water > 1 ? "s" : ""} restant${HYDRATION_GOAL - water > 1 ? "s" : ""}`}
                </div>
              </div>

              {/* Glass grid */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                {Array.from({ length: Math.max(HYDRATION_GOAL, water) }, (_, i) => (
                  <button key={i} onClick={() => setWater(i < water ? i : i + 1)} style={{
                    width: 44, height: 52, borderRadius: 8, border: `2px solid ${i < water ? C.water : "rgba(74,158,186,0.25)"}`,
                    background: i < water ? `linear-gradient(180deg, #7abfda 0%, #4a9eba 100%)` : "rgba(74,158,186,0.06)",
                    cursor: "pointer", fontSize: 20, transition: "all 0.2s",
                  }}>💧</button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <ActionBtn color={C.water} onClick={() => setWater(water - 1)}>- 1 verre</ActionBtn>
                <ActionBtn color={C.water} onClick={() => setWater(water + 1)}>+ 1 verre</ActionBtn>
                <ActionBtn color={C.water} onClick={() => setWater(0)} outline>Réinitialiser</ActionBtn>
              </div>

              <div style={{ marginTop: 20, padding: "12px 14px", background: "rgba(74,158,186,0.08)", borderRadius: 10, border: "1px solid rgba(74,158,186,0.2)" }}>
                <div style={{ fontSize: 12, color: C.water, fontWeight: "bold", marginBottom: 4 }}>💡 Le saviez-vous ?</div>
                <div style={{ fontSize: 12, color: "#5a8a9a", lineHeight: 1.6 }}>
                  Un adulte a besoin d'environ 1,5 à 2 litres d'eau par jour (soit 8 verres de 250ml). Les besoins augmentent lors d'activité physique ou de chaleur.
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <Field label="🕐 Heure de la première gorgée" type="time" value={dayData.firstWater || ""} onChange={v => updateDay({ firstWater: v })} />
            </div>
            <TextArea label="Notes hydratation (boissons, tisanes, etc.)" value={dayData.waterNotes || ""} onChange={v => updateDay({ waterNotes: v })} />
          </Section>
        )}

        {/* ════ SPORT TAB ════ */}
        {activeTab === "sport" && (
          <Section title="🏃 Entraînements" color={C.sport}>
            {(dayData.workouts || []).length > 0 && (
              <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                {[
                  { label: "Durée totale", val: `${totalSportMin} min`, icon: "⏱" },
                  { label: "Séances", val: String(dayData.workouts.length), icon: "🏅" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 16px", flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 18 }}>{s.icon}</div>
                    <div style={{ fontSize: 17, fontWeight: "bold", color: C.sport }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {(dayData.workouts || []).map(w => (
              <Card key={w.id} onClick={() => setExpandedItem(expandedItem === w.id ? null : w.id)}
                header={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", color: "#2a4a2a" }}>{w.type || "Entraînement"}</span>
                    <div style={{ display: "flex", gap: 5 }}>
                      {w.duration && <Pill color={C.sport}>{w.duration} min</Pill>}
                      {w.intensity && <Pill color={w.intensity.includes("🔴") ? "#e06060" : w.intensity.includes("🟡") ? "#d4a060" : C.sport}>{w.intensity}</Pill>}
                      <ChevronIcon open={expandedItem === w.id} />
                    </div>
                  </div>
                }>
                {expandedItem === w.id && (
                  <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <Grid2>
                      <SelectField label="Type de sport" value={w.type} onChange={v => updateDay({ workouts: dayData.workouts.map(x => x.id === w.id ? { ...x, type: v } : x) })} options={SPORT_TYPES} />
                      <Field label="Durée (min)" type="number" value={w.duration} onChange={v => updateDay({ workouts: dayData.workouts.map(x => x.id === w.id ? { ...x, duration: v } : x) })} />
                      <SelectField label="Intensité" value={w.intensity} onChange={v => updateDay({ workouts: dayData.workouts.map(x => x.id === w.id ? { ...x, intensity: v } : x) })} options={SPORT_INTENSITY} />
                      <Field label="Calories brûlées" type="number" value={w.calories} onChange={v => updateDay({ workouts: dayData.workouts.map(x => x.id === w.id ? { ...x, calories: v } : x) })} />
                    </Grid2>
                    <TextArea label="Notes (exercices, distance, ressenti...)" value={w.notes} onChange={v => updateDay({ workouts: dayData.workouts.map(x => x.id === w.id ? { ...x, notes: v } : x) })} />
                    <DeleteBtn onClick={() => removeWorkout(w.id)} />
                  </div>
                )}
              </Card>
            ))}

            {showAdd.workout ? (
              <AddForm title="Nouvel entraînement" onSave={addWorkout} onCancel={() => { setShowAdd(p => ({ ...p, workout: false })); setNewWorkout(emptyWorkout()); }}>
                <Grid2>
                  <SelectField label="Type de sport" value={newWorkout.type} onChange={v => setNewWorkout(p => ({ ...p, type: v }))} options={SPORT_TYPES} />
                  <Field label="Durée (min)" type="number" value={newWorkout.duration} onChange={v => setNewWorkout(p => ({ ...p, duration: v }))} />
                  <SelectField label="Intensité" value={newWorkout.intensity} onChange={v => setNewWorkout(p => ({ ...p, intensity: v }))} options={SPORT_INTENSITY} />
                  <Field label="Calories brûlées" type="number" value={newWorkout.calories} onChange={v => setNewWorkout(p => ({ ...p, calories: v }))} />
                </Grid2>
                <TextArea label="Notes" value={newWorkout.notes} onChange={v => setNewWorkout(p => ({ ...p, notes: v }))} />
              </AddForm>
            ) : <AddBtn color={C.sport} onClick={() => setShowAdd(p => ({ ...p, workout: true }))}>+ Ajouter un entraînement</AddBtn>}
          </Section>
        )}

        {/* ════ MEDITATION TAB ════ */}
        {activeTab === "meditation" && (
          <Section title="🧘 Méditation" color={C.meditation}>

            {/* Timer */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 14, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: C.meditation, marginBottom: 14, letterSpacing: "0.5px" }}>⏱ Minuteur de méditation</div>

              {meditationTimer.running ? (
                <>
                  <div style={{ fontSize: 52, fontWeight: "bold", color: C.meditation, letterSpacing: "-2px" }}>
                    {String(Math.floor((meditationTimer.target - meditationTimer.seconds) / 60)).padStart(2, "0")}:{String((meditationTimer.target - meditationTimer.seconds) % 60).padStart(2, "0")}
                  </div>
                  <div style={{ margin: "10px auto 14px", maxWidth: 250, height: 6, background: "#ece8f8", borderRadius: 10 }}>
                    <div style={{ width: `${(meditationTimer.seconds / meditationTimer.target) * 100}%`, height: "100%", background: `linear-gradient(90deg, #7a6aaa, #a08ad0)`, borderRadius: 10, transition: "width 1s linear" }} />
                  </div>
                  <button onClick={stopTimer} style={{ background: "none", border: `1px solid ${C.meditation}`, borderRadius: 10, padding: "8px 20px", color: C.meditation, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>⏹ Arrêter</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Choisir une durée</div>
                  <SelectField label="Type" value={newMeditation.type} onChange={v => setNewMeditation(p => ({ ...p, type: v }))} options={MEDITATION_TYPES} />
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
                    {[5, 10, 15, 20, 30].map(min => (
                      <button key={min} onClick={() => startTimer(min)} style={{
                        padding: "8px 16px", borderRadius: 12, border: `1.5px solid ${C.meditation}`,
                        background: "rgba(122,106,170,0.08)", color: C.meditation, cursor: "pointer",
                        fontFamily: "inherit", fontSize: 13, fontWeight: "bold",
                      }}>{min} min</button>
                    ))}
                  </div>
                  {meditationTimer.seconds > 0 && meditationTimer.seconds === meditationTimer.target && (
                    <div style={{ marginTop: 12, fontSize: 13, color: C.sport }}>✅ Séance enregistrée !</div>
                  )}
                </>
              )}
            </div>

            {/* Session log */}
            {(dayData.meditations || []).map(med => (
              <Card key={med.id} onClick={() => setExpandedItem(expandedItem === med.id ? null : med.id)}
                header={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", color: "#3a2a6a" }}>{med.type || "Méditation"}</span>
                    <div style={{ display: "flex", gap: 5 }}>
                      {med.duration && <Pill color={C.meditation}>{med.duration} min</Pill>}
                      <ChevronIcon open={expandedItem === med.id} />
                    </div>
                  </div>
                }>
                {expandedItem === med.id && (
                  <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <Grid2>
                      <SelectField label="Type" value={med.type} onChange={v => updateDay({ meditations: dayData.meditations.map(x => x.id === med.id ? { ...x, type: v } : x) })} options={MEDITATION_TYPES} />
                      <Field label="Durée (min)" type="number" value={med.duration} onChange={v => updateDay({ meditations: dayData.meditations.map(x => x.id === med.id ? { ...x, duration: v } : x) })} />
                    </Grid2>
                    <TextArea label="Ressenti après" value={med.notes} onChange={v => updateDay({ meditations: dayData.meditations.map(x => x.id === med.id ? { ...x, notes: v } : x) })} />
                    <DeleteBtn onClick={() => removeMeditation(med.id)} />
                  </div>
                )}
              </Card>
            ))}

            {showAdd.meditation ? (
              <AddForm title="Nouvelle séance" onSave={() => addMeditation()} onCancel={() => { setShowAdd(p => ({ ...p, meditation: false })); setNewMeditation(emptyMeditation()); }}>
                <Grid2>
                  <SelectField label="Type" value={newMeditation.type} onChange={v => setNewMeditation(p => ({ ...p, type: v }))} options={MEDITATION_TYPES} />
                  <Field label="Durée (min)" type="number" value={newMeditation.duration} onChange={v => setNewMeditation(p => ({ ...p, duration: v }))} />
                </Grid2>
                <TextArea label="Ressenti après" value={newMeditation.notes} onChange={v => setNewMeditation(p => ({ ...p, notes: v }))} />
              </AddForm>
            ) : <AddBtn color={C.meditation} onClick={() => setShowAdd(p => ({ ...p, meditation: true }))}>+ Ajouter manuellement</AddBtn>}
          </Section>
        )}

        {/* ════ WELLBEING TAB ════ */}
        {activeTab === "wellbeing" && (
          <>
            <Section title="💫 Bien-être & Contexte" color={C.wellbeing}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <SelectField label="😴 Qualité du sommeil" value={dayData.sleep} onChange={v => updateDay({ sleep: v })} options={SLEEP_QUALITY} />
                <Field label="🕐 Heures dormies" type="number" value={dayData.sleepHours} onChange={v => updateDay({ sleepHours: v })} placeholder="ex: 7.5" />
                <SelectField label="😊 Humeur générale" value={dayData.mood} onChange={v => updateDay({ mood: v })} options={MOODS} />
                <SelectField label="🌍 Contexte du jour" value={dayData.context} onChange={v => updateDay({ context: v })} options={CONTEXTS} />
              </div>
            </Section>

            <Section title="🌸 Cycle Féminin" color={C.food}>
              <Grid2>
                <SelectField label="Phase du cycle" value={dayData.cyclePhase} onChange={v => updateDay({ cyclePhase: v })} options={PHASES} />
                <Field label="Jour du cycle" type="number" value={dayData.cycleDay} onChange={v => updateDay({ cycleDay: v })} placeholder="ex: 14" />
              </Grid2>
              {dayData.cyclePhase && (
                <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(240,180,200,0.2)", border: "1px solid rgba(220,150,180,0.3)", fontSize: 12, color: "#b06080", lineHeight: 1.7 }}>
                  {dayData.cyclePhase === "Menstruelle" && "🩸 Phase menstruelle · Favorise les aliments riches en fer et en magnésium. Repos et douceur. Entraînements légers recommandés."}
                  {dayData.cyclePhase === "Folliculaire" && "🌱 Phase folliculaire · Énergie en hausse. Bonne fenêtre pour intensifier les entraînements. Protéines et légumes frais."}
                  {dayData.cyclePhase === "Ovulatoire" && "🌟 Phase ovulatoire · Pic d'énergie et de force ! Idéal pour les efforts intenses. Aliments anti-inflammatoires."}
                  {dayData.cyclePhase === "Lutéale" && "🍂 Phase lutéale · Besoins caloriques légèrement accrus. Glucides complexes et magnésium. Favorise le yoga et la marche."}
                </div>
              )}
            </Section>

            <Section title="📝 Notes libres" color={C.muted}>
              <TextArea label="Observations, ressentis, intentions..." value={dayData.notes} onChange={v => updateDay({ notes: v })} rows={4} />
            </Section>
          </>
        )}

        {/* ════ MEASUREMENTS TAB ════ */}
        {activeTab === "measurements" && (
          <Section title="📏 Mensurations" color={C.measurements}>
            {/* Latest */}
            {measurements[selectedDate] ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: "bold", color: C.measurements, marginBottom: 12 }}>
                  📌 Saisie du {formatDate(selectedDate)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { key: "weight", label: "Poids", unit: "kg", icon: "⚖️" },
                    { key: "waist", label: "Taille", unit: "cm", icon: "📐" },
                    { key: "hips", label: "Hanches", unit: "cm", icon: "🔵" },
                    { key: "bust", label: "Poitrine", unit: "cm", icon: "🔵" },
                    { key: "thighs", label: "Cuisses", unit: "cm", icon: "🔵" },
                    { key: "arms", label: "Bras", unit: "cm", icon: "💪" },
                  ].map(({ key, label, unit, icon }) => measurements[selectedDate][key] ? (
                    <div key={key} style={{ textAlign: "center", background: "rgba(138,106,74,0.06)", borderRadius: 10, padding: "8px 4px" }}>
                      <div style={{ fontSize: 16 }}>{icon}</div>
                      <div style={{ fontSize: 16, fontWeight: "bold", color: C.measurements }}>{measurements[selectedDate][key]}{unit}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{label}</div>
                    </div>
                  ) : null)}
                </div>
                {measurements[selectedDate].notes && (
                  <div style={{ marginTop: 10, fontSize: 12, color: C.muted, fontStyle: "italic" }}>{measurements[selectedDate].notes}</div>
                )}
                <button onClick={() => { setNewMeasurement(measurements[selectedDate]); setShowAdd(p => ({ ...p, measurement: true })); }} style={{ marginTop: 10, background: "none", border: `1px solid ${C.measurements}`, borderRadius: 8, color: C.measurements, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>✏️ Modifier</button>
              </div>
            ) : (
              !showAdd.measurement && (
                <AddBtn color={C.measurements} onClick={() => setShowAdd(p => ({ ...p, measurement: true }))}>+ Saisir mes mensurations du jour</AddBtn>
              )
            )}

            {showAdd.measurement && (
              <AddForm title="Mensurations" onSave={saveMeasurement} onCancel={() => setShowAdd(p => ({ ...p, measurement: false }))}>
                <Grid2>
                  <Field label="⚖️ Poids (kg)" type="number" value={newMeasurement.weight} onChange={v => setNewMeasurement(p => ({ ...p, weight: v }))} placeholder="ex: 62.5" />
                  <Field label="📐 Tour de taille (cm)" type="number" value={newMeasurement.waist} onChange={v => setNewMeasurement(p => ({ ...p, waist: v }))} placeholder="ex: 68" />
                  <Field label="🔵 Tour de hanches (cm)" type="number" value={newMeasurement.hips} onChange={v => setNewMeasurement(p => ({ ...p, hips: v }))} placeholder="ex: 92" />
                  <Field label="🔵 Tour de poitrine (cm)" type="number" value={newMeasurement.bust} onChange={v => setNewMeasurement(p => ({ ...p, bust: v }))} placeholder="ex: 88" />
                  <Field label="🔵 Tour de cuisses (cm)" type="number" value={newMeasurement.thighs} onChange={v => setNewMeasurement(p => ({ ...p, thighs: v }))} placeholder="ex: 54" />
                  <Field label="💪 Tour de bras (cm)" type="number" value={newMeasurement.arms} onChange={v => setNewMeasurement(p => ({ ...p, arms: v }))} placeholder="ex: 29" />
                </Grid2>
                <TextArea label="Notes" value={newMeasurement.notes} onChange={v => setNewMeasurement(p => ({ ...p, notes: v }))} />
              </AddForm>
            )}

            {/* History chart (simple) */}
            {measurementDates.length > 1 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: "bold", color: C.measurements, marginBottom: 12 }}>📈 Évolution (10 dernières entrées)</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                    <thead>
                      <tr>{["Date", "Poids", "Taille", "Hanches", "Poitrine"].map(h => <th key={h} style={{ padding: "4px 6px", color: C.muted, textAlign: "left", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {measurementDates.map(d => (
                        <tr key={d} style={{ background: d === selectedDate ? "rgba(138,106,74,0.07)" : "transparent" }}>
                          <td style={{ padding: "4px 6px", color: C.text, fontSize: 10 }}>{d.slice(5)}</td>
                          {["weight", "waist", "hips", "bust"].map(k => (
                            <td key={k} style={{ padding: "4px 6px", color: measurements[d]?.[k] ? C.measurements : "#ddd", fontWeight: d === selectedDate ? "bold" : "normal" }}>
                              {measurements[d]?.[k] ? `${measurements[d][k]}` : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ════ HISTORY TAB ════ */}
        {activeTab === "history" && (
          <div>
            <div style={{ fontSize: 16, fontWeight: "bold", color: C.primary, marginBottom: 14 }}>📅 Journal des 30 derniers jours</div>
            {historyDates.length === 0 && (
              <div style={{ textAlign: "center", color: C.muted, padding: 40, fontStyle: "italic" }}>Aucune entrée pour l'instant</div>
            )}
            {historyDates.map(date => {
              const d = allData[date] || {};
              const meals = d.meals || [];
              const macros = meals.reduce((a, m) => ({ p: a.p + (parseFloat(m.proteins) || 0), g: a.g + (parseFloat(m.carbs) || 0), l: a.l + (parseFloat(m.fats) || 0) }), { p: 0, g: 0, l: 0 });
              const sport = (d.workouts || []).reduce((a, w) => a + (parseInt(w.duration) || 0), 0);
              const med = (d.meditations || []).reduce((a, m) => a + (parseInt(m.duration) || 0), 0);
              const w = d.waterGlasses || 0;
              return (
                <div key={date} onClick={() => { setSelectedDate(date); setActiveTab("food"); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 16px", marginBottom: 10, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: C.primary, fontSize: 14 }}>{formatDate(date)}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                        {meals.length} repas · P{macros.p.toFixed(0)}g G{macros.g.toFixed(0)}g L{macros.l.toFixed(0)}g
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {w > 0 && <Pill color={C.water}>💧 {w}</Pill>}
                      {sport > 0 && <Pill color={C.sport}>🏃 {sport}m</Pill>}
                      {med > 0 && <Pill color={C.meditation}>🧘 {med}m</Pill>}
                      {d.cyclePhase && <Pill color={C.food}>🌸 {d.cyclePhase.slice(0, 4)}.</Pill>}
                      {measurements[date] && <Pill color={C.measurements}>📏 {measurements[date].weight ? measurements[date].weight + "kg" : "✓"}</Pill>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// ── UI Components ──────────────────────────────────────────────────────────
function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 13, fontWeight: "bold", color: color || "#8b3a3a", marginBottom: 10, letterSpacing: "0.4px" }}>{title}</div>
      {children}
    </div>
  );
}

function Card({ header, children, onClick }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(210,160,130,0.28)", borderRadius: 13, marginBottom: 9, overflow: "hidden" }}>
      <div onClick={onClick} style={{ padding: "11px 14px", cursor: "pointer" }}>{header}</div>
      {children && <div style={{ padding: "0 14px 12px" }}>{children}</div>}
    </div>
  );
}

function AddForm({ title, onSave, onCancel, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.92)", border: "1px dashed rgba(139,58,58,0.35)", borderRadius: 13, padding: "14px 14px", marginBottom: 9 }}>
      <div style={{ fontWeight: "bold", color: "#8b3a3a", marginBottom: 10, fontSize: 13 }}>{title}</div>
      {children}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={onSave} style={{ background: "#8b3a3a", color: "white", border: "none", borderRadius: 9, padding: "7px 18px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Ajouter</button>
        <button onClick={onCancel} style={{ background: "none", border: "1px solid #ccc", borderRadius: 9, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "#999" }}>Annuler</button>
      </div>
    </div>
  );
}

function AddBtn({ onClick, color, children }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "11px", borderRadius: 13, border: `1.5px dashed ${color}55`, background: `${color}08`, color, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>{children}</button>
  );
}

function ActionBtn({ onClick, color, outline, children }) {
  return (
    <button onClick={onClick} style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${color}`, background: outline ? "transparent" : `${color}15`, color, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>{children}</button>
  );
}

function DeleteBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ marginTop: 8, background: "none", border: "1px solid #e07060", borderRadius: 7, color: "#e07060", padding: "3px 11px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>🗑 Supprimer</button>
  );
}

function NavBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: "none", border: "none", fontSize: 18, cursor: disabled ? "default" : "pointer", color: disabled ? "#ddd" : "#8b3a3a", padding: "0 4px" }}>{children}</button>
  );
}

function ChevronIcon({ open }) {
  return <span style={{ color: "#b07060", fontSize: 11 }}>{open ? "▲" : "▼"}</span>;
}

function Grid2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{children}</div>;
}

function Pill({ children, color }) {
  return <span style={{ background: color + "18", color, border: `1px solid ${color}35`, borderRadius: 20, padding: "2px 7px", fontSize: 11, whiteSpace: "nowrap" }}>{children}</span>;
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, color: "#b07060", marginBottom: 3, letterSpacing: "0.4px" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid rgba(210,160,130,0.4)", background: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "inherit", color: "#3d2b1f", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, color: "#b07060", marginBottom: 3, letterSpacing: "0.4px" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid rgba(210,160,130,0.4)", background: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "inherit", color: value ? "#3d2b1f" : "#b07060", outline: "none", boxSizing: "border-box" }}>
        <option value="">— choisir —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 2 }) {
  return (
    <div style={{ marginTop: 8 }}>
      {label && <label style={{ display: "block", fontSize: 10, color: "#b07060", marginBottom: 3, letterSpacing: "0.4px" }}>{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid rgba(210,160,130,0.4)", background: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "inherit", color: "#3d2b1f", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }} />
    </div>
  );
}
