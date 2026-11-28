import type { CustomMethodInput } from '@skystats/api-client';
import { SkystatsApiError } from '@skystats/api-client';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { navigate } from '../../lib/router';

type Row = { item: string; qty: string; source: 'instasell' | 'instabuy' | 'npc' | 'bin' };
const blank = (source: Row['source']): Row => ({ item: '', qty: '1', source });

/** Max: build a private method from inputs and outputs; it's valued live like any other. */
export function CustomMethodPage({ id }: { id?: string }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'hour' | 'action'>('hour');
  const [outputs, setOutputs] = useState<Row[]>([blank('instasell')]);
  const [inputs, setInputs] = useState<Row[]>([]);
  const [coinsExtra, setCoinsExtra] = useState('0');
  const [requirements, setRequirements] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api.bazaar.list().then((b) => setItems(b.products.map((p) => ({ id: p.id, name: p.name })))).catch(() => {});
    if (!id) return;
    api.methods.get(`custom:${id}`).then((m) => {
      setName(m.name);
      setUnit(m.unit);
      const toRow = (l: (typeof m.lines)[number]): Row => ({ item: l.item, qty: String(l.qty), source: l.source });
      setOutputs(m.lines.filter((l) => l.side === 'out').map(toRow));
      setInputs(m.lines.filter((l) => l.side === 'in').map(toRow));
      setRequirements(m.requirements.join('\n'));
    }).catch(() => setError('Couldn’t load that method.'));
  }, [id]);

  const toRef = (rows: Row[]) => rows.filter((r) => r.item.trim()).map((r) => ({ item: (items.find((i) => i.name === r.item)?.id ?? r.item).trim().toUpperCase().replace(/\s+/g, '_'), qty: Number(r.qty) || 0, source: r.source }));

  async function save(e: FormEvent) {
    e.preventDefault();
    const input: CustomMethodInput = {
      name: name.trim(),
      spec: { unit, outputs: toRef(outputs), inputs: toRef(inputs), coins: Number(coinsExtra) || 0, requirements: requirements.split('\n').map((s) => s.trim()).filter(Boolean) },
    };
    try {
      const m = id ? await api.methods.updateCustom(id, input) : await api.methods.createCustom(input);
      navigate(`/methods/custom:${(m as { id: string }).id}`);
    } catch (err) {
      setError(err instanceof SkystatsApiError ? err.message : 'Couldn’t save.');
    }
  }

  const editor = (rows: Row[], set: (r: Row[]) => void, label: string, def: Row['source']) => (
    <fieldset className="card">
      <legend>{label}</legend>
      {rows.map((r, i) => (
        <div key={i} className="row method-row">
          <input list="method-items" placeholder="Item" value={r.item} onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, item: e.target.value } : x)))} aria-label="Item" />
          <input type="number" step="any" min="0" value={r.qty} onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} aria-label="Quantity" />
          <select value={r.source} onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, source: e.target.value as Row['source'] } : x)))} aria-label="Price">
            <option value="instasell">Instasell price</option>
            <option value="instabuy">Instabuy price</option>
            <option value="npc">NPC price</option>
            <option value="bin">Lowest BIN</option>
          </select>
          <button type="button" className="ghost" onClick={() => set(rows.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <button type="button" className="ghost" onClick={() => set([...rows, blank(def)])}>Add item</button>
    </fieldset>
  );

  return (
    <main className="wrap narrow">
      <h1 className="page-title">{id ? 'Edit method' : 'New custom method'}</h1>
      <p className="muted">Custom methods are private to you and valued from live prices.</p>
      {error && <p className="error">{error}</p>}
      <datalist id="method-items">
        {items.map((i) => <option key={i.id} value={i.name} />)}
      </datalist>
      <form onSubmit={(e) => void save(e)} className="method-form">
        <section className="card">
          <label>Name <input value={name} maxLength={60} required onChange={(e) => setName(e.target.value)} /></label>
          <label>
            Amounts are
            <select value={unit} onChange={(e) => setUnit(e.target.value as 'hour' | 'action')}>
              <option value="hour">per hour</option>
              <option value="action">per action (one craft, one flip)</option>
            </select>
          </label>
          <label>Extra coins per unit (e.g. NPC rewards) <input type="number" step="any" value={coinsExtra} onChange={(e) => setCoinsExtra(e.target.value)} /></label>
        </section>
        {editor(outputs, setOutputs, 'You get', 'instasell')}
        {editor(inputs, setInputs, 'You spend', 'instabuy')}
        <section className="card">
          <label>Requirements, one per line <textarea rows={3} value={requirements} onChange={(e) => setRequirements(e.target.value)} /></label>
        </section>
        <button type="submit">Save method</button>
      </form>
    </main>
  );
}
