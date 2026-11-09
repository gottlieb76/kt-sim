import { useMemo, useState } from 'react'
import { Fraction } from './engine'
import { evaluatePool } from './application/pool-analysis'
import type { PoolConfig, RerollPolicy } from './engine/pool'
import './App.css'

const initial: PoolConfig = { dice: 4, hitTarget: 3, critTarget: 6, rerolls: 1, policy: 'misses' }
const policies: Record<RerollPolicy, string> = {
  misses: 'Misses only', twos: 'Only faces showing 2', 'non-crits': 'Non-crits (misses first)',
}

function App() {
  const [config, setConfig] = useState<PoolConfig>(initial)
  const [stageIndex, setStageIndex] = useState<number | null>(null)
  const analysis = useMemo(() => evaluatePool(config, stageIndex), [config, stageIndex])
  const numberControl = (label: string, field: 'dice' | 'hitTarget' | 'critTarget' | 'rerolls', min: number, max: number) => (
    <label>{label}<select value={config[field]} onChange={event => {
      const value = Number(event.target.value)
      setConfig(previous => ({ ...previous, [field]: value, rerolls: field === 'dice' ? Math.min(previous.rerolls, value) : field === 'rerolls' ? value : previous.rerolls }))
    }}>
      {Array.from({ length: max - min + 1 }, (_, index) => index + min).map(value =>
        <option key={value} value={value}>{value}{field === 'hitTarget' || field === 'critTarget' ? '+' : ''}</option>)}
    </select></label>
  )

  return (
    <main>
      <header><p className="eyebrow">KT-SIM / PROBABILITY LAB</p><h1>Explore the odds.</h1>
        <p className="intro">Build a dice pool, apply a reroll, and see exactly what changes.</p></header>
      <div className="workspace">
        <aside className="panel controls">
          <h2>Your chain</h2><p className="muted">D6 rolls · exact probabilities</p>
          <section><h3><span className="step">01</span> Roll & classify</h3>
            {numberControl('Dice in the pool', 'dice', 1, 12)}
            <div className="pair">{numberControl('Hit on', 'hitTarget', 2, 6)}{numberControl('Crit on', 'critTarget', 2, 6)}</div>
            <p className="note">Crits take priority over hits. Successes include both ordinary hits and crits.</p>
            <div className="faces" aria-label="Face outcomes">{[1, 2, 3, 4, 5, 6].map(face => {
              const outcome = face >= config.critTarget ? 'crit' : face >= config.hitTarget ? 'hit' : 'miss'
              return <div key={face} className={`face ${outcome}`}><b>{face}</b><small>{outcome}</small></div>
            })}</div>
          </section>
          <section><h3><span className="step">02</span> Reroll</h3>
            {numberControl('Shared reroll budget', 'rerolls', 0, config.dice)}
            <label>Which dice?<select value={config.policy} onChange={event => setConfig({ ...config, policy: event.target.value as RerollPolicy })}>
              {Object.entries(policies).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
            <p className="note">Up to {config.rerolls} original dice across the whole pool. Each die can be rerolled once; unused rerolls are skipped. Non-crits rerolls misses before hits.</p>
          </section>
          <button className="reset" onClick={() => { setConfig(initial); setStageIndex(null) }}>Reset example</button>
        </aside>
        {analysis.status === 'error' ? <section className="panel" role="alert">
          <h2>Unable to calculate</h2><p>{analysis.message}</p>
          <p>Adjust the settings or reset the example to try again. No partial results are shown.</p>
        </section> : <PoolResults analysis={analysis} dice={config.dice} onSelect={setStageIndex} />}
      </div>
      <footer>Probability sandbox · No saves, damage, or other Kill Team rules applied.</footer>
    </main>
  )
}

function PoolResults({ analysis, dice, onSelect }: {
  analysis: Extract<ReturnType<typeof evaluatePool>, { status: 'ready' }>
  dice: number
  onSelect: (index: number) => void
}) {
  const { stages, selectedIndex, selected, summary, baseline, successes, joint } = analysis
  return (
    <div className="results">
      <section className="panel"><div className="section-heading"><h2>Chain analysis</h2><span className="badge">LIVE · EXACT</span></div>
        <p className="muted">Select a stage to inspect its full distribution.</p>
        <div className="table-scroll"><table className="stages"><thead><tr><th>Stage</th><th>Expected successes</th><th>Expected crits</th><th>All dice succeed</th></tr></thead><tbody>
          {stages.map((stage, index) => { const stats = stage.summary; return <tr key={stage.name} className={index === selectedIndex ? 'selected' : ''}>
            <th><button aria-pressed={index === selectedIndex} onClick={() => onSelect(index)}>{stage.name}</button></th>
            <td title={stats.successes.toString()}>{stats.successes.toNumber().toFixed(3)}</td><td title={stats.crits.toString()}>{stats.crits.toNumber().toFixed(3)}</td>
            <td title={stats.allSuccesses.toString()}>{stats.allSuccesses.toPercentage()}</td></tr> })}
        </tbody></table></div>
      </section>
      <section className="metrics" aria-live="polite">
        <div className="panel"><p>Expected successes</p><strong>{summary.successes.toNumber().toFixed(3)} <small>/ {dice}</small></strong>
          <span className="muted">{summary.successes.toString()} exact · started at {baseline.successes.toNumber().toFixed(3)}</span></div>
        <div className="panel"><p>At least one crit</p><strong>{summary.anyCrit.toPercentage()}</strong><span className="muted">{summary.anyCrit.toString()} exact</span></div>
      </section>
      <section className="panel"><h2>Success distribution</h2><p className="muted">{selected.name} · ordinary hits + crits</p>
        <div className="bars">{Array.from({ length: dice + 1 }, (_, count) => {
          const probability = successes.get(count) ?? new Fraction(0)
          return <div className="bar-row" key={count}><span>{count} {count === 1 ? 'success' : 'successes'}</span>
            <div className="track"><div style={{ width: probability.toPercentage(6) }} /></div>
            <b>{probability.toPercentage()}</b><small>{probability.toString()}</small></div>
        })}</div>
      </section>
      <section className="panel"><h2>Detailed outcomes</h2><p className="muted">Mutually exclusive outcomes after {selected.name.toLowerCase()}. Percentages are rounded; fractions are exact.</p>
        <details><summary>Show hits, crits, and misses ({joint.size} outcomes)</summary><div className="table-scroll"><table><thead><tr><th>Hits</th><th>Crits</th><th>Misses</th><th>Probability</th><th>Exact</th></tr></thead><tbody>
          {[...joint].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([key, probability]) => {
            const [hits, crits] = key.split(',').map(Number)
            return <tr key={key}><td>{hits}</td><td>{crits}</td><td>{dice - hits - crits}</td><td>{probability.toPercentage()}</td><td>{probability.toString()}</td></tr>
          })}
        </tbody></table></div></details>
      </section>
    </div>
  )
}

export default App
