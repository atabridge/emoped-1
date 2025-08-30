import React, { useMemo, useState } from 'react'

// ---- Types
type Actor = { logo?: string; name: string; desc?: string }
type Supplier = { logo?: string; name: string; desc?: string }
type EndUser = { name: string; desc?: string }
type EndUserFlow = { moped: boolean; battery: boolean }
type DiagramConfig = {
  ataToSuppliers: number[]
  ertugFromSuppliers: number[]
  fiyuuFromSuppliers: number[]
  fiyuuFromErtug: boolean
  endUserFromFiyuu: EndUserFlow
}
type Product = {
  id: string
  category: 'A'|'B'|'C'|'D'
  name: string
  image?: string
  specs?: string
  supplier?: string
}
type Year = '2026'|'2027'|'2028'
type Metric = 'Net Sales'|'Cost of Sales'|'Total OPEX'
type Financials = Record<'Ertug'|'Fiyuu Sales'|'Fiyuu Swap'|'AtaBridge', Record<Metric, Record<Year, number>>>

type State = {
  actors: [Actor, Actor, Actor]
  suppliers: Supplier[]
  endUser: EndUser
  diagramConfig: DiagramConfig
  products: Product[]
  financials: Financials
}

// ---- Utils
function setPath<T extends object>(obj: T, path: string, val: any): T {
  const segs = path.split('.')
  const clone: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) }
  let cur: any = clone
  for (let i = 0; i < segs.length - 1; i++) {
    const k = segs[i]
    cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] ?? {}) }
    cur = cur[k]
  }
  cur[segs[segs.length - 1]] = val
  return clone
}

function num(v: any): number {
  if (v === '' || v === null || v === undefined) return 0
  const n = Number(v)
  if (Number.isNaN(n)) return 0
  return n
}

// ---- Default State
const DEFAULT_STATE: State = {
  actors: [
    { name: 'AtaBridge', desc: 'Tedarik ve danışmanlık' },
    { name: 'Ertug', desc: 'Montaj & üretim' },
    { name: 'Fiyuu', desc: 'Satış & swap operasyonu' },
  ],
  suppliers: [
    { name: 'Jinggong', desc: 'Montaj hattı' },
    { name: 'Sanco', desc: 'Boru bükme makinası' },
    { name: 'Lingping', desc: 'Lazer kaynak makinası' },
    { name: 'Sleuu', desc: 'CKD e‑moped parçaları' },
    { name: 'Zhizhu', desc: 'Batarya & swap kabini' },
  ],
  endUser: { name: 'Kurye', desc: 'Son Kullanıcı' },
  diagramConfig: {
    ataToSuppliers: [0,1,2,3,4],
    ertugFromSuppliers: [0,1,2,3],
    fiyuuFromSuppliers: [4],
    fiyuuFromErtug: true,
    endUserFromFiyuu: { moped: true, battery: true },
  },
  products: [
    { id: crypto.randomUUID(), category: 'A', name: 'Montaj Hattı', image: '', specs: 'Jinggong', supplier: 'Jinggong' },
    { id: crypto.randomUUID(), category: 'B', name: 'BODYGUARD', image: '', specs: '3000W, 80km/s, 60–80km', supplier: 'Ertug' },
    { id: crypto.randomUUID(), category: 'C', name: 'LFP 72V 40Ah', image: '', specs: 'IP67, Akıllı BMS', supplier: 'Zhizhu' },
    { id: crypto.randomUUID(), category: 'D', name: 'Swap Kabini 10‑slot', image: '', specs: 'Uzaktan izleme, OTA', supplier: 'Zhizhu' },
  ],
  financials: {
    'Ertug': {
      'Net Sales':  {'2026': 107_949_600, '2027': 213_550_400, '2028': 353_410_000},
      'Cost of Sales': {'2026': 95_891_511, '2027': 176_597_577, '2028': 283_394_827},
      'Total OPEX': {'2026': 18_720_333, '2027': 27_934_550, '2028': 32_015_104},
    },
    'Fiyuu Sales': {
      'Net Sales':  {'2026': 143_595_000, '2027': 298_530_000, '2028': 516_853_125},
      'Cost of Sales': {'2026': 118_440_000, '2027': 221_520_000, '2028': 365_400_000},
      'Total OPEX': {'2026': 14_151_352, '2027': 21_224_257, '2028': 28_734_657},
    },
    'Fiyuu Swap': {
      'Net Sales':  {'2026': 108_889_200, '2027': 469_476_000, '2028': 1_119_787_200},
      'Cost of Sales': {'2026': 19_963_020, '2027': 74_844_000, '2028': 159_390_000},
      'Total OPEX': {'2026': 56_831_112, '2027': 172_439_965, '2028': 377_590_438},
    },
    'AtaBridge': {
      'Net Sales':  {'2026': 300_000, '2027': 330_000, '2028': 360_000}, // komisyon varsayım
      'Cost of Sales': {'2026': 0, '2027': 0, '2028': 0},
      'Total OPEX': {'2026': 200_000, '2027': 220_000, '2028': 240_000},
    }
  }
}

// ---- UI atoms
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border p-4 md:p-6 space-y-4">
      <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Row({ children, className='' }: { children: React.ReactNode; className?: string }) {
  return <div className={"grid gap-3 " + className}></div>
}

function Input({ label, value, onChange, placeholder }: { label?: string; value: string; onChange: (v:string)=>void; placeholder?: string }) {
  return (
    <label className="block text-sm">
      {label && <span className="text-slate-700">{label}</span>}
      <input className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300" value={value} placeholder={placeholder||''} onChange={(e)=>onChange(e.target.value)} />
    </label>
  )
}

function Textarea({ label, value, onChange, rows=4, placeholder }: { label?: string; value: string; onChange: (v:string)=>void; rows?: number; placeholder?: string }) {
  return (
    <label className="block text-sm">
      {label && <span className="text-slate-700">{label}</span>}
      <textarea rows={rows} className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300" value={value} placeholder={placeholder||''} onChange={(e)=>onChange(e.target.value)} />
    </label>
  )
}

function NumberInput({ label, value, onChange, step=1 }: { label?: string; value: number; onChange: (v:number)=>void; step?: number }) {
  return (
    <label className="block text-sm">
      {label && <span className="text-slate-700">{label}</span>}
      <input type="number" step={step} className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300" value={String(value)} onChange={(e)=>onChange(Number(e.target.value))} />
    </label>
  )
}

// ---- Layout helpers for diagram
function layoutPositions(count: number) {
  const H = 720
  const supplierW = 200, supplierH = 70, step = 210
  const marginX = 60
  const supplierY = 190
  const W = Math.max(1200, marginX + Math.max(0, count - 1) * step + supplierW + marginX)

  const outer = { x: 20, y: 20, w: W - 40, h: H - 40 }
  const centerX = (W - 200) / 2
  const posAta = { x: centerX, y: 70,  w: 200, h: 70 }
  const posErt = { x: centerX, y: 340, w: 200, h: 80 }
  const posFiy = { x: centerX, y: 500, w: 200, h: 80 }
  const posEndUser = { x: centerX, y: 620, w: 200, h: 70 }

  const supplierXs = Array.from({ length: count }, (_, i) => marginX + i * step)
  return { W, H, outer, posAta, supplierY, supplierW, supplierH, supplierXs, posErt, posFiy, posEndUser }
}

function Box({ x, y, w, h, title, desc }: {x:number;y:number;w:number;h:number;title:string;desc?:string}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={16} ry={16} fill="#ffffff" stroke="#94a3b8" />
      <text x={x + w/2} y={y + 28} textAnchor="middle" fontSize="16" fontWeight="700" fill="#0f172a">{title}</text>
      {desc && (
        <foreignObject x={x + 12} y={y + 40} width={w - 24} height={h - 52}>
          <div xmlns="http://www.w3.org/1999/xhtml" className="text-xs leading-5 text-slate-700">{desc}</div>
        </foreignObject>
      )}
    </g>
  )
}

function FlowDiagram({ actors, suppliers, config, endUser }:{actors:[Actor,Actor,Actor];suppliers:Supplier[];config:DiagramConfig;endUser:EndUser}) {
  const [actorAta, actorErtug, actorFiyuu] = actors
  const { W, H, outer, posAta, supplierY, supplierW, supplierH, supplierXs, posErt, posFiy, posEndUser } = layoutPositions(suppliers?.length || 0)
  const sup = (i:number) => suppliers?.[i] || { name: `Tedarikçi ${i + 1}`, desc: "" }
  const cfg = config || { ataToSuppliers: [], ertugFromSuppliers: [], fiyuuFromSuppliers: [], fiyuuFromErtug: false, endUserFromFiyuu: { moped: false, battery: false } }
  const labelEndUser = [cfg.endUserFromFiyuu?.moped ? "E‑moped" : null, cfg.endUserFromFiyuu?.battery ? "Batarya" : null].filter(Boolean).join(" + ")

  return (
    <div className="w-full overflow-x-auto">
      <svg style={{ width: W, height: H }} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className="block">
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L6,3 z" fill="#334155" />
          </marker>
        </defs>

        <rect x={outer.x} y={outer.y} width={outer.w} height={outer.h} rx={16} ry={16} fill="#fff" stroke="#e2e8f0" />

        <text x={40} y={60} fontSize="12" fill="#64748b">Danışmanlık & Tedarikçi Bulma</text>
        <text x={40} y={supplierY + 40} fontSize="12" fill="#64748b">Tedarikçiler</text>
        <text x={40} y={posErt.y + 40} fontSize="12" fill="#64748b">Montaj & Üretim</text>
        <text x={40} y={posFiy.y + 40} fontSize="12" fill="#64748b">Satış & Swap Operasyonu</text>
        <text x={40} y={posEndUser.y + 40} fontSize="12" fill="#64748b">Son Kullanıcı</text>

        <Box x={posAta.x} y={posAta.y} w={posAta.w} h={posAta.h} title={actorAta?.name || "AtaBridge"} desc={actorAta?.desc} />

        {supplierXs.map((x, i) => (
          <g key={i}>
            <Box x={x} y={supplierY} w={supplierW} h={supplierH} title={sup(i).name} desc={sup(i).desc} />
            {cfg.ataToSuppliers?.includes(i) && (<>
              <line x1={x + supplierW / 2} y1={supplierY - 8} x2={x + supplierW / 2} y2={supplierY - 32} stroke="#334155" strokeWidth={2} strokeDasharray="6 4" markerEnd="url(#arrow)" />
              <text x={x + supplierW / 2} y={supplierY - 40} textAnchor="middle" fontSize="12" fill="#475569">Bağlantı</text>
            </>)}
            {cfg.ertugFromSuppliers?.includes(i) && (
              <line x1={x + supplierW / 2} y1={supplierY + supplierH} x2={posErt.x + posErt.w / 2} y2={posErt.y} stroke="#334155" strokeWidth={2} markerEnd="url(#arrow)" />
            )}
            {cfg.fiyuuFromSuppliers?.includes(i) && (
              <line x1={x + supplierW / 2} y1={supplierY + supplierH} x2={posFiy.x + posFiy.w / 2} y2={posFiy.y} stroke="#334155" strokeWidth={2} markerEnd="url(#arrow)" />
            )}
          </g>
        ))}

        <Box x={posErt.x} y={posErt.y} w={posErt.w} h={posErt.h} title={actorErtug?.name || "Ertug"} desc={actorErtug?.desc} />

        {cfg.fiyuuFromErtug && (<>
          <line x1={posErt.x + posErt.w / 2} y1={posErt.y + posErt.h} x2={posFiy.x + posFiy.w / 2} y2={posFiy.y} stroke="#334155" strokeWidth={2} markerEnd="url(#arrow)" />
          <text x={posFiy.x + posFiy.w / 2 + 6} y={posFiy.y - 8} fontSize="12" fill="#475569">E‑moped</text>
        </>)}

        <Box x={posFiy.x} y={posFiy.y} w={posFiy.w} h={posFiy.h} title={actorFiyuu?.name || "Fiyuu"} desc={actorFiyuu?.desc} />

        {(cfg.endUserFromFiyuu?.moped || cfg.endUserFromFiyuu?.battery) && (<>
          <line x1={posFiy.x + posFiy.w / 2} y1={posFiy.y + posFiy.h} x2={posEndUser.x + posEndUser.w / 2} y2={posEndUser.y} stroke="#334155" strokeWidth={2} markerEnd="url(#arrow)" />
          {labelEndUser && (
            <text x={posFiy.x + posFiy.w / 2} y={posFiy.y + posFiy.h + 20} textAnchor="middle" fontSize="12" fill="#475569">{labelEndUser}</text>
          )}
        </>)}

        <g>
          <rect x={posEndUser.x} y={posEndUser.y} rx={16} ry={16} width={posEndUser.w} height={posEndUser.h} fill="#ffffff" stroke="#94a3b8" />
          <text x={posEndUser.x + posEndUser.w / 2} y={posEndUser.y + 28} textAnchor="middle" fontSize="16" fontWeight="700" fill="#0f172a">{endUser?.name || "Kurye"}</text>
          <foreignObject x={posEndUser.x + 12} y={posEndUser.y + 40} width={posEndUser.w - 24} height={posEndUser.h - 52}>
            <div xmlns="http://www.w3.org/1999/xhtml" className="text-xs leading-5 text-slate-700">{endUser?.desc || "Son Kullanıcı"}</div>
          </foreignObject>
        </g>

        <g>
          <rect x={outer.x + outer.w - 220} y={outer.y + outer.h - 110} width={200} height={90} rx={14} ry={14} fill="#ffffff" stroke="#e2e8f0" />
          <text x={outer.x + outer.w - 120} y={outer.y + outer.h - 86} textAnchor="middle" fontSize="12" fill="#475569">Lejant</text>
          <line x1={outer.x + outer.w - 200} y1={outer.y + outer.h - 64} x2={outer.x + outer.w - 120} y2={outer.y + outer.h - 64} stroke="#334155" strokeWidth={2} />
          <text x={outer.x + outer.w - 200} y={outer.y + outer.h - 52} fontSize="11" fill="#64748b">Satın Alma / Akış</text>
          <line x1={outer.x + outer.w - 200} y1={outer.y + outer.h - 34} x2={outer.x + outer.w - 120} y2={outer.y + outer.h - 34} stroke="#334155" strokeWidth={2} strokeDasharray="6 4" />
          <text x={outer.x + outer.w - 200} y={outer.y + outer.h - 22} fontSize="11" fill="#64748b">Bağlantı / Danışmanlık</text>
        </g>
      </svg>
    </div>
  )
}

// ---- Editors
function ActorsEditor({ state, setState }:{ state: State; setState: React.Dispatch<React.SetStateAction<State>> }) {
  const updateActor = (idx:number, patch: Partial<Actor>) => setState(s => {
    const next = {...s}
    next.actors = [...s.actors] as any
    next.actors[idx] = { ...next.actors[idx], ...patch }
    return next
  })
  return (
    <SectionCard title="Aktörler">
      <div className="grid md:grid-cols-3 gap-4">
        {state.actors.map((a, i) => (
          <div key={i} className="border rounded-xl p-3 space-y-2 bg-slate-50">
            <Input label="Firma Adı" value={a.name} onChange={(v)=>updateActor(i, {name: v})} />
            <Textarea label="Kısa Tanım" value={a.desc||''} onChange={(v)=>updateActor(i, {desc: v})} rows={3} />
            <Input label="Logo URL (opsiyonel)" value={a.logo||''} onChange={(v)=>updateActor(i, {logo: v})} />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function SuppliersEditor({ state, setState }:{ state: State; setState: React.Dispatch<React.SetStateAction<State>> }) {
  const update = (i:number, patch: Partial<Supplier>) => setState(s=>setPath(s, `suppliers.${i}`, { ...s.suppliers[i], ...patch }))
  const add = ()=> setState(s=> ({...s, suppliers: [...s.suppliers, { name: '', desc: '' }]}))
  const remove = (i:number)=> setState(s=> ({...s, suppliers: s.suppliers.filter((_,j)=>j!==i)}))
  return (
    <SectionCard title="Tedarikçiler">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-slate-600">Tedarikçi listesi (yeni ekleyebilir/silebilirsiniz)</div>
        <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white" onClick={add}>+ Ekle</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {state.suppliers.map((s, i) => (
          <div key={i} className="border rounded-xl p-3 space-y-2">
            <Input label="Firma Adı" value={s.name} onChange={(v)=>update(i, {name: v})} />
            <Textarea label="Kısa Tanım" value={s.desc||''} onChange={(v)=>update(i, {desc: v})} rows={2} />
            <Input label="Logo URL (opsiyonel)" value={s.logo||''} onChange={(v)=>update(i, {logo: v})} />
            <div className="flex justify-end">
              <button className="text-sm text-red-600" onClick={()=>remove(i)}>Sil</button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function ProductsEditor({ state, setState }:{ state: State; setState: React.Dispatch<React.SetStateAction<State>> }) {
  const update = (id:string, patch: Partial<Product>) => setState(s=> ({
    ...s, products: s.products.map(p=> p.id===id ? {...p, ...patch} : p)
  }))
  const add = ()=> setState(s=> ({...s, products: [...s.products, { id: crypto.randomUUID(), category:'A', name:'', image:'', specs:'', supplier:'' }]}))
  const remove = (id:string)=> setState(s=> ({...s, products: s.products.filter(p=>p.id!==id)}))
  const catLabel = (c: Product['category']) => ({A: 'A) Üretim Ekipmanları', B:'B) E‑Moped', C:'C) Battery', D:'D) Kabinet'}[c])
  return (
    <SectionCard title="Ürünler & Teknoloji">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-slate-600">Ürün portföyü (isim, resim, özellikler, tedarikçi)</div>
        <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white" onClick={add}>+ Ekle</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {state.products.map((p) => (
          <div key={p.id} className="border rounded-xl p-3 space-y-2 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="text-slate-700">Kategori</span>
                <select className="mt-1 w-full rounded-xl border px-3 py-2" value={p.category} onChange={(e)=>update(p.id, {category: e.target.value as any})}>
                  <option value="A">A) Üretim Ekipmanları</option>
                  <option value="B">B) E‑Moped</option>
                  <option value="C">C) Battery</option>
                  <option value="D">D) Kabinet</option>
                </select>
              </label>
              <Input label="Ürün Adı" value={p.name} onChange={(v)=>update(p.id, {name: v})} />
            </div>
            <Input label="Resim URL" value={p.image||''} onChange={(v)=>update(p.id, {image: v})} />
            <Textarea label="Özellikler" value={p.specs||''} onChange={(v)=>update(p.id, {specs: v})} rows={3} />
            <Input label="Tedarikçi" value={p.supplier||''} onChange={(v)=>update(p.id, {supplier: v})} />
            {p.image && <img src={p.image} alt={p.name} className="rounded-lg border w-full h-40 object-cover" />}
            <div className="flex justify-between text-xs text-slate-600">
              <span>{catLabel(p.category)}</span>
              <button className="text-red-600" onClick={()=>remove(p.id)}>Sil</button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function DiagramEditor({ state, setState }:{ state: State; setState: React.Dispatch<React.SetStateAction<State>> }) {
  const cfg = state.diagramConfig || {} as DiagramConfig
  const setCfg = (patch: Partial<DiagramConfig>) => setState((s)=> ({ ...s, diagramConfig: { ...s.diagramConfig, ...patch } }))
  const toggleIdx = (arr:number[]|undefined, idx:number) => {
    const set = new Set(arr || [])
    set.has(idx) ? set.delete(idx) : set.add(idx)
    return Array.from(set).sort((a,b)=>a-b)
  }
  const setVal = (path: string, val: any) => setState((s)=> setPath(s, path, val))

  return (
    <SectionCard title="İş Planı Diyagramı – Veri Girişi">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold">Danışmanlık & Tedarikçi Bulma (AtaBridge)</h3>
          <Input label="Firma Adı" value={state.actors[0].name} onChange={(v)=>setVal('actors.0.name', v)} />
          <Textarea label="Kısa Tanım" value={state.actors[0].desc||''} onChange={(v)=>setVal('actors.0.desc', v)} rows={3} />
          <div className="mt-2">
            <div className="text-sm text-slate-700 mb-1">AtaBridge → Tedarikçiler (Bağlantı)</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {state.suppliers.map((s, i) => (
                <label key={i} className="flex items-center gap-2 text-sm border rounded p-2">
                  <input type="checkbox" checked={cfg.ataToSuppliers?.includes(i) || false} onChange={()=>setCfg({ ataToSuppliers: toggleIdx(cfg.ataToSuppliers, i) })} />
                  <span>{s.name || `Tedarikçi ${i+1}`}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Tedarikçiler</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {state.suppliers.map((s, i) => (
              <div key={i} className="border rounded p-3 space-y-2">
                <Input label="Firma Adı" value={s.name} onChange={(v)=>setVal(`suppliers.${i}.name`, v)} />
                <Textarea label="Kısa Tanım" value={s.desc||''} onChange={(v)=>setVal(`suppliers.${i}.desc`, v)} rows={2} />
                <div className="text-xs text-slate-600">İlişkilendirme:</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <label className="flex items-center gap-1"><input type="checkbox" checked={cfg.ertugFromSuppliers?.includes(i) || false} onChange={()=>setCfg({ ertugFromSuppliers: toggleIdx(cfg.ertugFromSuppliers, i) })} />Ertug satın alır</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={cfg.fiyuuFromSuppliers?.includes(i) || false} onChange={()=>setCfg({ fiyuuFromSuppliers: toggleIdx(cfg.fiyuuFromSuppliers, i) })} />Fiyuu satın alır</label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Montaj & Üretim (Ertug)</h3>
          <Input label="Firma Adı" value={state.actors[1].name} onChange={(v)=>setVal('actors.1.name', v)} />
          <Textarea label="Kısa Tanım" value={state.actors[1].desc||''} onChange={(v)=>setVal('actors.1.desc', v)} rows={3} />
          <div className="flex items-center gap-2 text-sm mt-2">
            <input id="fiyuuFromErtug" type="checkbox" checked={cfg.fiyuuFromErtug || false} onChange={(e)=>setCfg({ fiyuuFromErtug: e.target.checked })} />
            <label htmlFor="fiyuuFromErtug">Fiyuu, Ertug’dan E‑moped satın alır</label>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">E‑Moped Satış & Swap Ağı (Fiyuu)</h3>
          <Input label="Firma Adı" value={state.actors[2].name} onChange={(v)=>setVal('actors.2.name', v)} />
          <Textarea label="Kısa Tanım" value={state.actors[2].desc||''} onChange={(v)=>setVal('actors.2.desc', v)} rows={3} />
          <div className="text-sm text-slate-700 mt-1">Fiyuu’nun tedarikçilerden satın alımı</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {state.suppliers.map((s, i) => (
              <label key={i} className="flex items-center gap-2 text-sm border rounded p-2">
                <input type="checkbox" checked={cfg.fiyuuFromSuppliers?.includes(i) || false} onChange={()=>setCfg({ fiyuuFromSuppliers: toggleIdx(cfg.fiyuuFromSuppliers, i) })} />
                <span>{s.name || `Tedarikçi ${i+1}`}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Son Kullanıcı</h3>
          <Input label="Firma/Grup Adı" value={state.endUser?.name || ''} onChange={(v)=>setVal('endUser.name', v)} />
          <Textarea label="Kısa Tanım" value={state.endUser?.desc || ''} onChange={(v)=>setVal('endUser.desc', v)} rows={3} />
          <div className="text-sm text-slate-700 mt-1">Fiyuu’dan satın alma</div>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={cfg.endUserFromFiyuu?.moped || false} onChange={(e)=>setCfg({ endUserFromFiyuu: { ...cfg.endUserFromFiyuu, moped: e.target.checked } })} />E‑moped</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={cfg.endUserFromFiyuu?.battery || false} onChange={(e)=>setCfg({ endUserFromFiyuu: { ...cfg.endUserFromFiyuu, battery: e.target.checked } })} />Batarya</label>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function FinancialsEditor({ state, setState }:{ state: State; setState: React.Dispatch<React.SetStateAction<State>> }) {
  const entities = Object.keys(state.financials) as Array<keyof Financials>
  const years: Year[] = ['2026','2027','2028']
  const metrics: Metric[] = ['Net Sales','Cost of Sales','Total OPEX']

  const setMetric = (entity: keyof Financials, metric: Metric, year: Year, value: number) => {
    setState(s => {
      const next = {...s}
      const cur = {...next.financials[entity]}
      const m = {...cur[metric]}
      m[year] = value
      cur[metric] = m
      next.financials = {...next.financials, [entity]: cur}
      return next
    })
  }

  return (
    <SectionCard title="Finansal Planlama – 3 Yıllık P&L">
      <div className="space-y-8">
        {entities.map((e)=>{
          const f = state.financials[e]
          const gross: Record<Year, number> = { '2026':0,'2027':0,'2028':0 }
          const ebitda: Record<Year, number> = { '2026':0,'2027':0,'2028':0 }
          years.forEach(y => {
            gross[y] = num(f['Net Sales'][y]) - num(f['Cost of Sales'][y])
            ebitda[y] = gross[y] - num(f['Total OPEX'][y])
          })
          return (
            <div key={String(e)} className="border rounded-2xl p-4 bg-white">
              <h3 className="font-semibold text-lg mb-3">{String(e)}</h3>
              <div className="grid md:grid-cols-4 gap-4 items-start">
                {metrics.map((m) => (
                  <div key={m} className="space-y-2">
                    <div className="text-sm font-medium">{m}</div>
                    {years.map(y => (
                      <NumberInput key={y} label={y} value={f[m][y]} onChange={(v)=>setMetric(e, m, y, v)} step={0.01} />
                    ))}
                  </div>
                ))}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Hesaplanan</div>
                  {years.map(y => (
                    <div key={y} className="p-2 rounded-xl bg-slate-50 border text-sm">
                      <div><span className="font-semibold">Gross:</span> {gross[y].toLocaleString('tr-TR')}</div>
                      <div><span className="font-semibold">EBITDA:</span> {ebitda[y].toLocaleString('tr-TR')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ---- App with tabs
export default function App() {
  const [state, setState] = useState<State>(DEFAULT_STATE)
  const [tab, setTab] = useState<'dashboard'|'actors'|'suppliers'|'products'|'diagram'|'financials'>('dashboard')

  const maxEbitda = useMemo(()=>{
    const years: Year[] = ['2026','2027','2028']
    let mx = 0
    for (const ent of Object.keys(state.financials) as Array<keyof Financials>) {
      const f = state.financials[ent]
      years.forEach(y => {
        const gross = num(f['Net Sales'][y]) - num(f['Cost of Sales'][y])
        const ebitda = gross - num(f['Total OPEX'][y])
        if (ebitda > mx) mx = ebitda
      })
    }
    return mx
  }, [state.financials])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">E‑Moped Üretimi & Batarya Swap – Dashboard</h1>
      </header>

      <nav className="flex flex-wrap gap-2">
        {[
          ['dashboard', 'Dashboard'],
          ['actors', 'Aktörler'],
          ['suppliers', 'Tedarikçiler'],
          ['products', 'Ürün & Teknoloji'],
          ['diagram', 'İş Planı Diyagramı'],
          ['financials', 'Finans'],
        ].map(([k, label]) => (
          <button key={k}
            className={`px-3 py-1.5 rounded-full border ${tab===k ? 'bg-slate-900 text-white' : 'bg-white'}`}
            onClick={()=>setTab(k as any)}>{label}</button>
        ))}
      </nav>

      {tab==='dashboard' && (
        <div className="space-y-6">
          <SectionCard title="Yönetici Özeti">
            <div className="text-sm leading-6 text-slate-700">
              Proje Adı: <b>E‑Moped Üretimi & Batarya Swap İstasyonları</b><br/>
              Aktörler: <b>AtaBridge</b> (tedarik & danışmanlık), <b>Ertug</b> (montaj & üretim), <b>Fiyuu</b> (satış & swap operasyonu).<br/>
              Amaç: Türkiye’de hızla büyüyen e‑mobilite pazarında entegre <b>e‑moped üretimi</b> ve <b>batarya swap</b> altyapısı ile ölçeklenebilir ekosistem kurmak.
            </div>
          </SectionCard>

          <SectionCard title="İş Planı Diyagramı – İş Süreci Akışı">
            <FlowDiagram actors={state.actors} suppliers={state.suppliers} config={state.diagramConfig} endUser={state.endUser} />
          </SectionCard>

          <SectionCard title="Ürün Portföyü (Özet)">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {state.products.map(p => (
                <div key={p.id} className="border rounded-xl p-3 bg-white space-y-2">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-600">{p.supplier || '-'}</div>
                  {p.image ? <img className="w-full h-32 object-cover rounded" src={p.image} /> : <div className="h-32 bg-slate-100 rounded grid place-items-center text-xs text-slate-500">Görsel yok</div>}
                  <div className="text-xs text-slate-700 whitespace-pre-wrap">{p.specs}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab==='actors' && <ActorsEditor state={state} setState={setState} />}
      {tab==='suppliers' && <SuppliersEditor state={state} setState={setState} />}
      {tab==='products' && <ProductsEditor state={state} setState={setState} />}
      {tab==='diagram' && <DiagramEditor state={state} setState={setState} />}
      {tab==='financials' && <FinancialsEditor state={state} setState={setState} />}

      <footer className="pt-4 text-xs text-slate-500">
        Max EBITDA (hesaplanan): {maxEbitda.toLocaleString('tr-TR')}
      </footer>
    </div>
  )
}
