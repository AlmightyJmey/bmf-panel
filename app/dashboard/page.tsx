'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const COLS = ['Razie Cayo','Razie Zona','Actiuni Ilegale','Mina','Cayo Locatie','Patrule','Livrare']
const COL_KEYS = ['score_razie_cayo','score_razie_zona','score_actiuni_ilegale','score_mina','score_cayo_locatie','score_patrule','score_livrare']
const RANKS: Record<string, string[]> = {
  afacere: ['Barman / Security','Supervizor','Manager General'],
  '50boys': ['Rookies','Main Line','Right Hand','Leutenant','Enforcer','Street Boss','Crew Leader'],
  bmf: ['Youngin','Hitter','Shot Caller','OG','Co-Lider','Lider']
}

function getMonday(d = new Date()) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const m = new Date(d)
  m.setDate(diff)
  m.setHours(0,0,0,0)
  return m
}
function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
function fmt(d: Date) { return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2) }
function fmtISO(d: Date) { return d.toISOString().split('T')[0] }
function weekLabel(ws: Date) {
  const end = addDays(ws, 6)
  return fmt(ws)+' - '+fmt(end)+'.'+end.getFullYear()
}
function totalScore(m: any) {
  return COL_KEYS.reduce((a, k) => a + (m[k] || 0), 0)
}
function getRankClass(r: string, f: string) {
  if ((f==='bmf'&&(r==='Lider'||r==='Co-Lider'))||(f==='50boys'&&(r==='Crew Leader'||r==='Street Boss'))||(f==='afacere'&&r==='Manager General')) return 'rank-badge rank-gold'
  return 'rank-badge rank-silver'
}

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [page, setPage] = useState('members')
  const [family, setFamily] = useState('bmf')
  const [weekStart, setWeekStart] = useState(getMonday())
  const [members, setMembers] = useState<any[]>([])
  const [weekData, setWeekData] = useState<{[memberId: string]: any}>({})
  const [trezorerie, setTrezorerie] = useState<any[]>([])
  const [missions, setMissions] = useState<any[]>([])
  const [jurnal, setJurnal] = useState<any[]>([])
  const [invoiri, setInvoiri] = useState<any[]>([])
  const [memberCounts, setMemberCounts] = useState<{[k:string]:number}>({})
  const [allMembersForInvoire, setAllMembersForInvoire] = useState<any[]>([])
  const [modal, setModal] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single()
      if (!p) { router.push('/login'); return }
      setProfile(p)
    })
  }, [router])

  const canEdit = useCallback((fam: string) => {
    if (!profile) return false
    if (profile.is_admin) return true
    if (profile.can_edit && profile.family === fam) return true
    return false
  }, [profile])

  const canApprove = useCallback(() => {
    if (!profile) return false
    return profile.is_admin || profile.can_approve
  }, [profile])

  const loadMembers = useCallback(async () => {
    const { data: memberList } = await supabase.from('members').select('*').eq('family', family).order('created_at')
    setMembers(memberList || [])

    if (memberList && memberList.length > 0) {
      const ids = memberList.map((m: any) => m.id)
      const { data: weekRows } = await supabase.from('member_weeks').select('*')
        .in('member_id', ids).eq('week_start', fmtISO(weekStart))
      const wd: {[k: string]: any} = {}
      for (const m of memberList) {
        const row = (weekRows || []).find((w: any) => w.member_id === m.id)
        wd[m.id] = row || { scores: {}, status: 'In lucru', predat: 'Nu', task_saptamanal: 'Neinceput', task_promovare: 'Neinceput', ...COL_KEYS.reduce((a,k)=>({...a,[k]:0}),{}) }
      }
      setWeekData(wd)
    } else {
      setWeekData({})
    }
  }, [family, weekStart])

  const loadMemberCounts = useCallback(async () => {
    const counts: {[k:string]:number} = {}
    for (const f of ['afacere','50boys','bmf']) {
      const { count } = await supabase.from('members').select('id', { count: 'exact', head: true }).eq('family', f)
      counts[f] = count || 0
    }
    setMemberCounts(counts)
  }, [])

  const loadAllMembersForInvoire = useCallback(async () => {
    const { data } = await supabase.from('members').select('*').order('nome')
    setAllMembersForInvoire(data || [])
  }, [])

  const loadTrezorerie = useCallback(async () => {
    const { data } = await supabase.from('trezorerie').select('*').order('created_at', {ascending:false})
    setTrezorerie(data || [])
  }, [])

  const loadMissions = useCallback(async () => {
    const { data } = await supabase.from('missions').select('*').order('created_at', {ascending:false})
    setMissions(data || [])
  }, [])

  const loadJurnal = useCallback(async () => {
    const { data } = await supabase.from('jurnal').select('*').order('created_at', {ascending:false}).limit(100)
    setJurnal(data || [])
  }, [])

  const loadInvoiri = useCallback(async () => {
    const { data } = await supabase.from('invoiri').select('*').order('created_at', {ascending:false})
    setInvoiri(data || [])
  }, [])

  useEffect(() => { if (profile) { loadMembers(); loadMemberCounts() } }, [profile, family, weekStart, loadMembers, loadMemberCounts])
  useEffect(() => { if (profile) loadInvoiri() }, [profile, loadInvoiri])
  useEffect(() => { if (profile && page === 'trezorerie') loadTrezorerie() }, [profile, page, loadTrezorerie])
  useEffect(() => { if (profile && page === 'missions') loadMissions() }, [profile, page, loadMissions])
  useEffect(() => { if (profile && page === 'jurnal') loadJurnal() }, [profile, page, loadJurnal])
  useEffect(() => { if (profile && (page === 'invoiri')) { loadAllMembersForInvoire() } }, [profile, page, loadAllMembersForInvoire])
  useEffect(() => { if (profile && page === 'statistici') { loadTrezorerie(); loadMissions(); loadMemberCounts() } }, [profile, page, loadTrezorerie, loadMissions, loadMemberCounts])

  async function addLog(text: string, culoare = 'gold') {
    await supabase.from('jurnal').insert({ text, culoare, user_username: profile?.username })
  }

  async function ensureWeekRow(memberId: string) {
    const existing = weekData[memberId]
    if (existing && existing.id) return existing.id
    const { data, error } = await supabase.from('member_weeks').insert({
      member_id: memberId, week_start: fmtISO(weekStart),
      status: 'In lucru', predat: 'Nu', task_saptamanal: 'Neinceput', task_promovare: 'Neinceput',
      ...COL_KEYS.reduce((a,k)=>({...a,[k]:0}),{})
    }).select().single()
    if (error) { console.error(error); return null }
    setWeekData(prev => ({ ...prev, [memberId]: data }))
    return data.id
  }

  async function handleScoreChange(memberId: string, colKey: string, delta: number) {
    if (!canEdit(family)) return
    const rowId = await ensureWeekRow(memberId)
    if (!rowId) return
    const current = weekData[memberId]?.[colKey] || 0
    const newVal = Math.max(0, current + delta)
    await supabase.from('member_weeks').update({ [colKey]: newVal }).eq('id', rowId)
    const m = members.find(x => x.id === memberId)
    const colLabel = COLS[COL_KEYS.indexOf(colKey)]
    await addLog(`${profile.username} a modificat ${colLabel} pentru ${m?.nome} (${delta > 0 ? '+' : ''}${delta})`)
    setWeekData(prev => ({ ...prev, [memberId]: { ...prev[memberId], [colKey]: newVal } }))
  }

  async function handleWeekFieldChange(memberId: string, field: string, value: string) {
    if (!canEdit(family)) return
    const rowId = await ensureWeekRow(memberId)
    if (!rowId) return
    await supabase.from('member_weeks').update({ [field]: value }).eq('id', rowId)
    const m = members.find(x => x.id === memberId)
    await addLog(`${profile.username} a modificat ${field} pentru ${m?.nome}: ${value}`)
    setWeekData(prev => ({ ...prev, [memberId]: { ...prev[memberId], [field]: value } }))
  }

  async function handleMemberInfoChange(memberId: string, field: string, value: string) {
    if (!canEdit(family)) return
    await supabase.from('members').update({ [field]: value }).eq('id', memberId)
    const m = members.find(x => x.id === memberId)
    await addLog(`${profile.username} a modificat ${field} pentru ${m?.nome}: ${value}`)
    setMembers(prev => prev.map(x => x.id === memberId ? { ...x, [field]: value } : x))
  }

  async function handleDeleteMember(m: any) {
    if (!confirm('Stergi membrul ' + m.nome + ' definitiv (din toate saptamanile)?')) return
    await supabase.from('members').delete().eq('id', m.id)
    await addLog(`${profile.username} a sters membrul ${m.nome} din ${family}`, 'red')
    loadMembers(); loadMemberCounts()
  }

  async function handleSaveMember() {
    setSaving(true)
    await supabase.from('members').insert({ family, nome: form.nome, rank: form.rank })
    await addLog(`${profile.username} a adaugat membrul ${form.nome} in ${family} (permanent)`, 'green')
    setSaving(false); setModal(null); loadMembers(); loadMemberCounts()
  }

  async function handleSaveTrez() {
    setSaving(true)
    const suma = parseInt(form.suma)
    await supabase.from('trezorerie').insert({ tip: form.tip||'intrare', descriere: form.descriere, suma, adaugat_de: profile.username })
    await addLog(`${profile.username} a adaugat ${form.tip||'intrare'}: ${form.descriere} - ${suma.toLocaleString()}$`, form.tip==='iesire'?'red':'green')
    setSaving(false); setModal(null); loadTrezorerie()
  }

  async function handleSaveMission() {
    setSaving(true)
    await supabase.from('missions').insert({ titlu: form.titlu, descriere: form.descriere, familie: form.familie||'BMF', deadline: form.deadline||null, progres: parseInt(form.progres)||0, status:'In lucru' })
    await addLog(`${profile.username} a adaugat misiunea "${form.titlu}"`)
    setSaving(false); setModal(null); loadMissions()
  }

  async function handleDeleteMission(m: any) {
    if (!confirm('Stergi misiunea?')) return
    await supabase.from('missions').delete().eq('id', m.id)
    await addLog(`${profile.username} a sters misiunea "${m.titlu}"`, 'red')
    loadMissions()
  }

  async function handleMissionProgress(m: any, val: number) {
    const status = val >= 100 ? 'Indeplinit' : 'In lucru'
    await supabase.from('missions').update({ progres: val, status }).eq('id', m.id)
    setMissions(prev => prev.map(x => x.id === m.id ? { ...x, progres: val, status } : x))
  }

  async function handleSaveInvoire() {
    setSaving(true)
    const sel = form.memberSel
    if (!sel) { setSaving(false); return }
    const [memberId, fam] = sel.split('|')
    const m = allMembersForInvoire.find(x => x.id === memberId)
    if (!m || !form.dataInceput || !form.dataSfarsit || !form.motiv) { setSaving(false); return }
    await supabase.from('invoiri').insert({
      member_id: memberId, nume: m.nome, familie: fam,
      data_inceput: form.dataInceput, data_sfarsit: form.dataSfarsit, motiv: form.motiv, status: 'In asteptare'
    })
    await addLog(`${profile.username} a depus o invoire pentru ${m.nome} (${form.dataInceput} - ${form.dataSfarsit})`)
    setSaving(false); setModal(null); loadInvoiri()
  }

  async function handleRespondInvoire(inv: any, status: string) {
    await supabase.from('invoiri').update({ status, raspuns_de: profile.username }).eq('id', inv.id)
    await addLog(`${profile.username} a ${status==='Aprobat'?'aprobat':'respins'} invoirea lui ${inv.nume}`, status==='Aprobat'?'green':'red')
    loadInvoiri()
  }

  function getMemberInvoire(memberId: string) {
    const list = invoiri.filter(x => x.member_id === memberId)
    if (!list.length) return null
    const pending = list.find(x => x.status === 'In asteptare')
    if (pending) return pending
    return list[0]
  }

  const soldTrez = trezorerie.reduce((a,x) => x.tip==='intrare' ? a+x.suma : a-x.suma, 0)
  const isCurrentWeek = getMonday().getTime() === weekStart.getTime()
  const isAfacere = family === 'afacere'
  const pendingInvCount = invoiri.filter(x => x.status === 'In asteptare').length

  if (!profile) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#7dc8ff',fontSize:'14px'}}>
      Se incarca...
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <div style={{background:'rgba(15,15,17,0.95)',borderBottom:'0.5px solid #1e1e22',padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{fontSize:'18px',fontWeight:500,color:'#fff',letterSpacing:'2px'}}>B<span style={{color:'#7dc8ff'}}>M</span>F</div>
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          <span style={{fontSize:'11px',color:'#888'}}>
            <span style={{color:'#7dc8ff',fontWeight:500}}>{profile.username}</span> — {profile.rank}
          </span>
          <button className="btn-sm" onClick={async()=>{await supabase.auth.signOut();router.push('/login')}}>
            Iesire
          </button>
          {profile.is_admin && (
            <button className="btn-sm" onClick={()=>{setModal({type:'addUser'});setForm({family:'bmf',rank:'Youngin',can_edit:false})}}>
              + Cont nou
            </button>
          )}
        </div>
      </div>

      <div style={{display:'flex',flex:1}}>
        <div style={{width:'155px',background:'rgba(13,13,15,0.95)',borderRight:'0.5px solid #1a1a1d',padding:'12px 0',flexShrink:0}}>
          {[
            {id:'members',icon:'👥',label:'Membri'},
            {id:'missions',icon:'🎯',label:'Misiuni'},
            {id:'invoiri',icon:'📋',label:'Invoiri',badge:pendingInvCount},
            {id:'trezorerie',icon:'💰',label:'Trezorerie'},
            {id:'statistici',icon:'📊',label:'Statistici'},
            {id:'jurnal',icon:'📜',label:'Jurnal'},
          ].map(n => (
            <div key={n.id} onClick={()=>setPage(n.id)} style={{
              display:'flex',alignItems:'center',gap:'8px',padding:'9px 14px',
              fontSize:'12px',cursor:'pointer',
              color: page===n.id ? '#7dc8ff' : '#777',
              background: page===n.id ? '#111' : 'transparent',
              borderLeft: page===n.id ? '2px solid #7dc8ff' : '2px solid transparent'
            }}>
              <span style={{fontSize:'14px'}}>{n.icon}</span> {n.label}
              {!!n.badge && <span style={{background:'#7dc8ff',color:'#06141f',fontSize:'9px',padding:'1px 5px',borderRadius:'10px',marginLeft:'auto',fontWeight:500}}>{n.badge}</span>}
            </div>
          ))}
        </div>

        <div style={{flex:1,padding:'16px',overflowX:'auto',overflowY:'auto'}}>

          {page === 'members' && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',marginBottom:'14px',background:'rgba(17,17,19,0.9)',border:'0.5px solid #1e1e22',borderRadius:'8px',padding:'10px'}}>
                <button className="btn-sm" onClick={()=>setWeekStart(addDays(weekStart,-7))}>‹</button>
                <div style={{fontSize:'13px',fontWeight:500}}>
                  {weekLabel(weekStart)}
                  {isCurrentWeek && <span style={{fontSize:'10px',color:'#7dc8ff',marginLeft:'8px'}}>curenta</span>}
                </div>
                <button className="btn-sm" onClick={()=>setWeekStart(addDays(weekStart,7))}>›</button>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'14px'}}>
                {[{id:'afacere',icon:'🏢',name:'Afacere',sub:'Bahamas Mamas'},{id:'50boys',icon:'🛡',name:'50BOYS',sub:'Familia mica'},{id:'bmf',icon:'👑',name:'BMF',sub:'Familia mare'}].map(t=>(
                  <div key={t.id} onClick={()=>setFamily(t.id)} style={{
                    background: family===t.id ? '#0e1f2c' : 'rgba(17,17,19,0.9)',
                    border: `0.5px solid ${family===t.id ? '#7dc8ff' : '#1e1e22'}`,
                    borderRadius:'10px',padding:'12px',cursor:'pointer',textAlign:'center'
                  }}>
                    <div style={{fontSize:'20px',marginBottom:'4px'}}>{t.icon}</div>
                    <div style={{fontSize:'12px',fontWeight:500}}>{t.name}</div>
                    <div style={{fontSize:'10px',color:'#555',marginTop:'1px'}}>{t.sub}</div>
                    <div style={{fontSize:'10px',color:'#7dc8ff',marginTop:'3px'}}>{memberCounts[t.id]||0} membri</div>
                  </div>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:isAfacere?'repeat(2,1fr)':'repeat(4,1fr)',gap:'8px',marginBottom:'12px'}}>
                {(isAfacere ? [
                  {v:members.length,l:'Total membri'},
                  {v:members.reduce((a,m)=>a+totalScore(weekData[m.id]||{}),0),l:'Puncte total'},
                ] : [
                  {v:members.length,l:'Total membri'},
                  {v:members.filter(m=>(weekData[m.id]?.status)!=='Inactiv').length,l:'Activi'},
                  {v:members.filter(m=>(weekData[m.id]?.status)==='Indeplinit').length,l:'Indeplinit'},
                  {v:members.reduce((a,m)=>a+totalScore(weekData[m.id]||{}),0),l:'Puncte total'},
                ]).map((s,i)=>(
                  <div key={i} style={{background:'rgba(17,17,19,0.9)',borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                    <div style={{fontSize:'20px',fontWeight:500,color:'#7dc8ff'}}>{s.v}</div>
                    <div style={{fontSize:'10px',color:'#555',marginTop:'2px'}}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                <div style={{fontSize:'13px',fontWeight:500,color:'#7dc8ff'}}>
                  {isAfacere?'Bahamas Mamas':family==='50boys'?'50BOYS':'BMF'}
                </div>
                {canEdit(family) && (
                  <button style={{background:'#7dc8ff',color:'#06141f',border:'none',borderRadius:'7px',padding:'5px 12px',fontSize:'11px',fontWeight:500,cursor:'pointer'}}
                    onClick={()=>{setModal({type:'member'});setForm({rank:RANKS[family][0]})}}>
                    + Adauga membru
                  </button>
                )}
              </div>

              <div style={{overflowX:'auto',border:'0.5px solid #1e1e22',borderRadius:'10px',background:'rgba(10,10,12,0.6)'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px',minWidth: isAfacere ? '600px' : '950px'}}>
                  <thead>
                    <tr>
                      <th style={{background:'rgba(17,17,19,0.95)',color:'#666',padding:'7px 10px',textAlign:'left',borderBottom:'0.5px solid #1e1e22',fontWeight:400,whiteSpace:'nowrap',fontSize:'10px'}}>Membru</th>
                      <th style={{background:'rgba(17,17,19,0.95)',color:'#666',padding:'7px 6px',textAlign:'center',borderBottom:'0.5px solid #1e1e22',fontWeight:400,fontSize:'10px'}}>Rank</th>
                      {COLS.map(c=><th key={c} style={{background:'rgba(17,17,19,0.95)',color:'#666',padding:'7px 5px',textAlign:'center',borderBottom:'0.5px solid #1e1e22',fontWeight:400,whiteSpace:'nowrap',fontSize:'10px'}}>{c}</th>)}
                      <th style={{background:'rgba(17,17,19,0.95)',color:'#666',padding:'7px 5px',textAlign:'center',borderBottom:'0.5px solid #1e1e22',fontWeight:400,fontSize:'10px'}}>Total</th>
                      {!isAfacere && <>
                        <th style={{background:'rgba(17,17,19,0.95)',color:'#666',padding:'7px 5px',textAlign:'center',borderBottom:'0.5px solid #1e1e22',fontWeight:400,fontSize:'10px'}}>Status</th>
                        <th style={{background:'rgba(17,17,19,0.95)',color:'#666',padding:'7px 5px',textAlign:'center',borderBottom:'0.5px solid #1e1e22',fontWeight:400,fontSize:'10px'}}>Predat</th>
                        <th style={{background:'rgba(17,17,19,0.95)',color:'#666',padding:'7px 5px',textAlign:'center',borderBottom:'0.5px solid #1e1e22',fontWeight:400,fontSize:'10px'}}>Task S.</th>
                        <th style={{background:'rgba(17,17,19,0.95)',color:'#666',padding:'7px 5px',textAlign:'center',borderBottom:'0.5px solid #1e1e22',fontWeight:400,fontSize:'10px'}}>Task P.</th>
                        <th style={{background:'rgba(17,17,19,0.95)',color:'#666',padding:'7px 5px',textAlign:'center',borderBottom:'0.5px solid #1e1e22',fontWeight:400,fontSize:'10px'}}>Invoire</th>
                      </>}
                      {canEdit(family) && <th style={{background:'rgba(17,17,19,0.95)',padding:'7px 5px',borderBottom:'0.5px solid #1e1e22'}}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m)=>{
                      const wd = weekData[m.id] || {}
                      const edit = canEdit(family)
                      const inv = getMemberInvoire(m.id)
                      return (
                        <tr key={m.id} style={{borderBottom:'0.5px solid #111'}}>
                          {edit ? (
                            <>
                              <td style={{padding:'5px 10px'}}><input defaultValue={m.nome} onBlur={e=>e.target.value!==m.nome && handleMemberInfoChange(m.id,'nome',e.target.value)} style={{background:'#0a0a0c',border:'0.5px solid #2a2a2e',color:'#e8e8e8',borderRadius:'5px',padding:'4px 6px',fontSize:'11px',width:'100%',minWidth:'90px'}} /></td>
                              <td style={{padding:'5px'}}>
                                <select value={m.rank} onChange={e=>handleMemberInfoChange(m.id,'rank',e.target.value)} style={{background:'#0a0a0c',border:'0.5px solid #2a2a2e',color:'#e8e8e8',borderRadius:'5px',padding:'4px',fontSize:'10px',width:'100%'}}>
                                  {RANKS[family].map(r=><option key={r} value={r}>{r}</option>)}
                                </select>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{padding:'6px 10px',fontWeight:500,whiteSpace:'nowrap'}}>{m.nome}</td>
                              <td style={{padding:'6px 5px',textAlign:'center'}}><span className={getRankClass(m.rank,family)}>{m.rank}</span></td>
                            </>
                          )}
                          {COL_KEYS.map(k=>(
                            <td key={k} style={{padding:'5px',textAlign:'center'}}>
                              {edit ? (
                                <div className="score-ctrl">
                                  <button className="score-btn minus" onClick={()=>handleScoreChange(m.id,k,-1)}>-</button>
                                  <span style={{minWidth:'16px',textAlign:'center',fontSize:'11px',fontWeight:500}}>{wd[k]||0}</span>
                                  <button className="score-btn plus" onClick={()=>handleScoreChange(m.id,k,1)}>+</button>
                                </div>
                              ) : <span>{wd[k]||0}</span>}
                            </td>
                          ))}
                          <td style={{padding:'6px 5px',textAlign:'center',fontWeight:500,color:'#7dc8ff'}}>{totalScore(wd)}</td>
                          {!isAfacere && (
                            <>
                              {edit ? (
                                <>
                                  <td style={{padding:'5px'}}>
                                    <select value={wd.status||'In lucru'} onChange={e=>handleWeekFieldChange(m.id,'status',e.target.value)} style={{background:'#0a0a0c',border:'0.5px solid #2a2a2e',color:'#e8e8e8',borderRadius:'5px',padding:'4px',fontSize:'10px',width:'100%'}}>
                                      <option value="In lucru">In lucru</option><option value="Indeplinit">Indeplinit</option><option value="Inactiv">Inactiv</option>
                                    </select>
                                  </td>
                                  <td style={{padding:'5px'}}>
                                    <select value={wd.predat||'Nu'} onChange={e=>handleWeekFieldChange(m.id,'predat',e.target.value)} style={{background:'#0a0a0c',border:'0.5px solid #2a2a2e',color:'#e8e8e8',borderRadius:'5px',padding:'4px',fontSize:'10px',width:'100%'}}>
                                      <option value="Nu">Nu</option><option value="Da">Da</option>
                                    </select>
                                  </td>
                                  <td style={{padding:'5px'}}>
                                    <select value={wd.task_saptamanal||'Neinceput'} onChange={e=>handleWeekFieldChange(m.id,'task_saptamanal',e.target.value)} style={{background:'#0a0a0c',border:'0.5px solid #2a2a2e',color:'#e8e8e8',borderRadius:'5px',padding:'4px',fontSize:'10px',width:'100%'}}>
                                      <option value="Neinceput">Neinceput</option><option value="In lucru">In lucru</option><option value="Indeplinit">Indeplinit</option>
                                    </select>
                                  </td>
                                  <td style={{padding:'5px'}}>
                                    <select value={wd.task_promovare||'Neinceput'} onChange={e=>handleWeekFieldChange(m.id,'task_promovare',e.target.value)} style={{background:'#0a0a0c',border:'0.5px solid #2a2a2e',color:'#e8e8e8',borderRadius:'5px',padding:'4px',fontSize:'10px',width:'100%'}}>
                                      <option value="Neinceput">Neinceput</option><option value="In lucru">In lucru</option><option value="Indeplinit">Indeplinit</option>
                                    </select>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td style={{padding:'6px 5px',textAlign:'center'}}>{wd.status||'In lucru'}</td>
                                  <td style={{padding:'6px 5px',textAlign:'center'}}>{wd.predat||'Nu'}</td>
                                  <td style={{padding:'6px 5px',textAlign:'center',fontSize:'10px',color:'#777'}}>{wd.task_saptamanal||'Neinceput'}</td>
                                  <td style={{padding:'6px 5px',textAlign:'center',fontSize:'10px',color:'#777'}}>{wd.task_promovare||'Neinceput'}</td>
                                </>
                              )}
                              <td style={{padding:'6px 5px',textAlign:'center'}}>
                                {inv ? (
                                  <button
                                    className={`inv-dot ${inv.status==='Aprobat'?'approved':inv.status==='Respins'?'rejected':'pending'}`}
                                    onClick={()=>{setPage('invoiri')}}
                                    aria-label="Detalii invoire"
                                    title={`${inv.status}: ${inv.data_inceput} - ${inv.data_sfarsit}`}
                                  />
                                ) : <span className="inv-dot-empty" />}
                              </td>
                            </>
                          )}
                          {edit && (
                            <td style={{padding:'6px 5px',textAlign:'center'}}>
                              <button style={{background:'transparent',border:'none',color:'#e24b4a',cursor:'pointer',fontSize:'13px'}} onClick={()=>handleDeleteMember(m)} aria-label="Sterge">🗑</button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                    {members.length===0 && (
                      <tr><td colSpan={14} style={{padding:'2rem',textAlign:'center',color:'#444',fontSize:'12px'}}>Niciun membru inca — adauga primul membru</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'trezorerie' && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <div style={{fontSize:'13px',fontWeight:500,color:'#7dc8ff'}}>💰 Trezorerie BMF</div>
                {(profile.is_admin||profile.can_edit) && (
                  <button style={{background:'#7dc8ff',color:'#06141f',border:'none',borderRadius:'7px',padding:'5px 12px',fontSize:'11px',fontWeight:500,cursor:'pointer'}}
                    onClick={()=>{setModal({type:'trez'});setForm({tip:'intrare'})}}>+ Adauga</button>
                )}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'10px',marginBottom:'14px'}}>
                <div style={{background:'#0a0a0c',border:'0.5px solid #1e1e22',borderRadius:'8px',padding:'12px'}}>
                  <div style={{fontSize:'10px',color:'#555',marginBottom:'4px'}}>Intrari totale</div>
                  <div style={{fontSize:'18px',fontWeight:500,color:'#4caf50'}}>+{trezorerie.filter(x=>x.tip==='intrare').reduce((a,x)=>a+x.suma,0).toLocaleString()}$</div>
                </div>
                <div style={{background:'#0a0a0c',border:'0.5px solid #1e1e22',borderRadius:'8px',padding:'12px'}}>
                  <div style={{fontSize:'10px',color:'#555',marginBottom:'4px'}}>Iesiri totale</div>
                  <div style={{fontSize:'18px',fontWeight:500,color:'#e24b4a'}}>-{trezorerie.filter(x=>x.tip==='iesire').reduce((a,x)=>a+x.suma,0).toLocaleString()}$</div>
                </div>
                <div style={{background:'#0a0a0c',border:'0.5px solid #1e1e22',borderRadius:'8px',padding:'12px'}}>
                  <div style={{fontSize:'10px',color:'#555',marginBottom:'4px'}}>Sold curent</div>
                  <div style={{fontSize:'18px',fontWeight:500,color:'#7dc8ff'}}>{soldTrez.toLocaleString()}$</div>
                </div>
                <div style={{background:'#0a0a0c',border:'0.5px solid #1e1e22',borderRadius:'8px',padding:'12px'}}>
                  <div style={{fontSize:'10px',color:'#555',marginBottom:'4px'}}>Tranzactii</div>
                  <div style={{fontSize:'18px',fontWeight:500,color:'#7dc8ff'}}>{trezorerie.length}</div>
                </div>
              </div>
              <div className="card">
                <div style={{fontSize:'12px',fontWeight:500,color:'#7dc8ff',marginBottom:'10px'}}>Tranzactii recente</div>
                {trezorerie.map(x=>(
                  <div key={x.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 0',borderBottom:'0.5px solid #1a1a1a'}}>
                    <span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'20px',background:x.tip==='intrare'?'#0a1a18':'#1a0a0a',color:x.tip==='intrare'?'#4caf50':'#e24b4a',whiteSpace:'nowrap'}}>{x.tip==='intrare'?'+ Intrare':'- Iesire'}</span>
                    <span style={{flex:1,fontSize:'11px',color:'#ccc'}}>{x.descriere}</span>
                    <span style={{fontSize:'12px',fontWeight:500,color:x.tip==='intrare'?'#4caf50':'#e24b4a',whiteSpace:'nowrap'}}>{x.tip==='intrare'?'+':'−'}{x.suma.toLocaleString()}$</span>
                    <span style={{fontSize:'10px',color:'#444',whiteSpace:'nowrap'}}>{x.adaugat_de}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page === 'missions' && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <div style={{fontSize:'13px',fontWeight:500,color:'#7dc8ff'}}>🎯 Misiuni & Taskuri</div>
                {(profile.is_admin||profile.can_edit) && (
                  <button style={{background:'#7dc8ff',color:'#06141f',border:'none',borderRadius:'7px',padding:'5px 12px',fontSize:'11px',fontWeight:500,cursor:'pointer'}}
                    onClick={()=>{setModal({type:'mission'});setForm({familie:'BMF',progres:0})}}>+ Adauga</button>
                )}
              </div>
              {missions.map(m=>(
                <div key={m.id} style={{background:'#0a0a0c',border:'0.5px solid #1e1e22',borderRadius:'10px',padding:'12px',marginBottom:'10px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'5px'}}>
                    <span style={{fontSize:'12px',fontWeight:500}}>{m.titlu}</span>
                    <span style={{fontSize:'9px',padding:'2px 8px',borderRadius:'20px',background:'#1c2c38',color:'#7dc8ff'}}>{m.familie}</span>
                  </div>
                  <div style={{fontSize:'11px',color:'#666',marginBottom:'8px'}}>{m.descriere}</div>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    {m.deadline && <span style={{fontSize:'10px',color:'#555',whiteSpace:'nowrap'}}>📅 {m.deadline}</span>}
                    {(profile.is_admin||profile.can_edit) ? (
                      <>
                        <input type="range" min={0} max={100} value={m.progres} onChange={e=>handleMissionProgress(m,parseInt(e.target.value))} style={{flex:1,WebkitAppearance:'none',height:'4px',borderRadius:'2px',background:'#1a1a1a',cursor:'pointer'}} />
                        <span style={{fontSize:'10px',color:'#7dc8ff',minWidth:'28px',textAlign:'right'}}>{m.progres}%</span>
                        <button style={{background:'transparent',border:'none',color:'#555',cursor:'pointer',fontSize:'13px'}} onClick={()=>handleDeleteMission(m)} aria-label="Sterge">🗑</button>
                      </>
                    ) : (
                      <>
                        <div style={{flex:1,height:'4px',background:'#1a1a1a',borderRadius:'2px'}}>
                          <div style={{height:'4px',borderRadius:'2px',background:'#7dc8ff',width:`${m.progres}%`}}></div>
                        </div>
                        <span style={{fontSize:'10px',color:'#7dc8ff',minWidth:'28px',textAlign:'right'}}>{m.progres}%</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {missions.length===0 && <div style={{textAlign:'center',color:'#444',padding:'2rem',fontSize:'12px'}}>Nicio misiune activa</div>}
            </div>
          )}

          {page === 'invoiri' && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <div style={{fontSize:'13px',fontWeight:500,color:'#7dc8ff'}}>📋 Invoiri</div>
                <button style={{background:'#7dc8ff',color:'#06141f',border:'none',borderRadius:'7px',padding:'5px 12px',fontSize:'11px',fontWeight:500,cursor:'pointer'}}
                  onClick={()=>{setModal({type:'invoire'});setForm({})}}>+ Depune invoire</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'14px'}}>
                <div style={{background:'rgba(17,17,19,0.9)',borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:'20px',fontWeight:500,color:'#7dc8ff'}}>{invoiri.length}</div>
                  <div style={{fontSize:'10px',color:'#555',marginTop:'2px'}}>Total invoiri</div>
                </div>
                <div style={{background:'rgba(17,17,19,0.9)',borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:'20px',fontWeight:500,color:'#7dc8ff'}}>{pendingInvCount}</div>
                  <div style={{fontSize:'10px',color:'#555',marginTop:'2px'}}>In asteptare</div>
                </div>
                <div style={{background:'rgba(17,17,19,0.9)',borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:'20px',fontWeight:500,color:'#4caf50'}}>{invoiri.filter(x=>x.status==='Aprobat').length}</div>
                  <div style={{fontSize:'10px',color:'#555',marginTop:'2px'}}>Aprobate</div>
                </div>
                <div style={{background:'rgba(17,17,19,0.9)',borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                  <div style={{fontSize:'20px',fontWeight:500,color:'#e24b4a'}}>{invoiri.filter(x=>x.status==='Respins').length}</div>
                  <div style={{fontSize:'10px',color:'#555',marginTop:'2px'}}>Respinse</div>
                </div>
              </div>
              {invoiri.map(inv=>(
                <div key={inv.id} style={{background:'#0a0a0c',border:'0.5px solid #1e1e22',borderRadius:'8px',padding:'11px',marginBottom:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'5px'}}>
                    <span style={{fontSize:'12px',fontWeight:500}}>{inv.nume}</span>
                    <span style={{fontSize:'9px',padding:'2px 8px',borderRadius:'20px',background:inv.status==='Aprobat'?'#0a1a18':inv.status==='Respins'?'#1a0a0a':'#0e1f2c',color:inv.status==='Aprobat'?'#4caf50':inv.status==='Respins'?'#e24b4a':'#7dc8ff'}}>{inv.status}</span>
                  </div>
                  <div style={{fontSize:'10px',color:'#888',marginBottom:'5px'}}>📅 {inv.data_inceput} → {inv.data_sfarsit}</div>
                  <div style={{fontSize:'11px',color:'#666',marginBottom:'8px'}}>{inv.motiv}</div>
                  {inv.status==='In asteptare' && canApprove() ? (
                    <div style={{display:'flex',gap:'6px'}}>
                      <button style={{background:'#0a1a18',color:'#4caf50',border:'0.5px solid #1a3a30',borderRadius:'6px',padding:'4px 10px',fontSize:'10px',cursor:'pointer'}} onClick={()=>handleRespondInvoire(inv,'Aprobat')}>✓ Aproba</button>
                      <button style={{background:'#1a0a0a',color:'#e24b4a',border:'0.5px solid #3a1a1a',borderRadius:'6px',padding:'4px 10px',fontSize:'10px',cursor:'pointer'}} onClick={()=>handleRespondInvoire(inv,'Respins')}>✕ Respinge</button>
                    </div>
                  ) : inv.raspuns_de ? (
                    <div style={{fontSize:'10px',color:'#444'}}>Raspuns de: {inv.raspuns_de}</div>
                  ) : null}
                </div>
              ))}
              {invoiri.length===0 && <div style={{textAlign:'center',color:'#444',padding:'2rem',fontSize:'12px'}}>Nicio invoire depusa</div>}
            </div>
          )}

          {page === 'statistici' && (
            <div>
              <div style={{fontSize:'13px',fontWeight:500,color:'#7dc8ff',marginBottom:'14px'}}>📊 Statistici generale</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'14px'}}>
                {[
                  {v:soldTrez.toLocaleString()+'$',l:'Sold trezorerie'},
                  {v:missions.length,l:'Total misiuni'},
                  {v:missions.filter(x=>x.status!=='Indeplinit').length,l:'Misiuni active'},
                  {v:pendingInvCount,l:'Invoiri in asteptare'},
                ].map((s,i)=>(
                  <div key={i} style={{background:'rgba(17,17,19,0.9)',borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                    <div style={{fontSize:'18px',fontWeight:500,color:'#7dc8ff'}}>{s.v}</div>
                    <div style={{fontSize:'10px',color:'#555',marginTop:'2px'}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{fontSize:'12px',fontWeight:500,color:'#7dc8ff',marginBottom:'12px'}}>Membri pe familie</div>
                {[{id:'afacere',l:'Afacere'},{id:'50boys',l:'50BOYS'},{id:'bmf',l:'BMF'}].map(f=>(
                  <div key={f.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'0.5px solid #1a1a1a'}}>
                    <span style={{fontSize:'12px',color:'#7dc8ff',fontWeight:500}}>{f.l}</span>
                    <span style={{fontSize:'11px',color:'#888'}}>{memberCounts[f.id]||0} membri</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page === 'jurnal' && (
            <div>
              <div style={{fontSize:'13px',fontWeight:500,color:'#7dc8ff',marginBottom:'14px'}}>📜 Jurnal activitate</div>
              <div className="card">
                {jurnal.map(l=>(
                  <div key={l.id} style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'7px 0',borderBottom:'0.5px solid #1a1a1a'}}>
                    <div style={{width:'7px',height:'7px',borderRadius:'50%',background:l.culoare==='green'?'#4caf50':l.culoare==='red'?'#e24b4a':'#7dc8ff',marginTop:'4px',flexShrink:0}}></div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'11px',color:'#ccc'}}>{l.text}</div>
                      <div style={{fontSize:'10px',color:'#444',marginTop:'1px'}}>{new Date(l.created_at).toLocaleString('ro-RO')}</div>
                    </div>
                  </div>
                ))}
                {jurnal.length===0 && <div style={{textAlign:'center',color:'#444',padding:'1.5rem',fontSize:'12px'}}>Nicio activitate inregistrata</div>}
              </div>
            </div>
          )}

        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
          <div style={{background:'#141416',border:'0.5px solid #2a2a2e',borderRadius:'12px',padding:'1.5rem',width:'100%',maxWidth:'320px',maxHeight:'90vh',overflowY:'auto'}}>

            {modal.type==='member' && (<>
              <h3 style={{fontSize:'14px',fontWeight:500,color:'#7dc8ff',marginBottom:'1rem'}}>Adauga membru</h3>
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px'}}>Nume | ID</label>
              <input type="text" placeholder="ex: Goku | 12345" value={form.nome||''} onChange={e=>setForm({...form,nome:e.target.value})} />
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Rank</label>
              <select value={form.rank||''} onChange={e=>setForm({...form,rank:e.target.value})}>
                {RANKS[family].map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </>)}

            {modal.type==='trez' && (<>
              <h3 style={{fontSize:'14px',fontWeight:500,color:'#7dc8ff',marginBottom:'1rem'}}>Adauga tranzactie</h3>
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px'}}>Tip</label>
              <select value={form.tip||'intrare'} onChange={e=>setForm({...form,tip:e.target.value})}>
                <option value="intrare">Intrare</option><option value="iesire">Iesire</option>
              </select>
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Descriere</label>
              <input type="text" placeholder="ex: Razie Cayo saptamana 25" value={form.descriere||''} onChange={e=>setForm({...form,descriere:e.target.value})} />
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Suma ($)</label>
              <input type="number" placeholder="ex: 50000" value={form.suma||''} onChange={e=>setForm({...form,suma:e.target.value})} />
            </>)}

            {modal.type==='mission' && (<>
              <h3 style={{fontSize:'14px',fontWeight:500,color:'#7dc8ff',marginBottom:'1rem'}}>Adauga misiune</h3>
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px'}}>Titlu</label>
              <input type="text" placeholder="Numele misiunii" value={form.titlu||''} onChange={e=>setForm({...form,titlu:e.target.value})} />
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Descriere</label>
              <textarea placeholder="Detalii..." value={form.descriere||''} onChange={e=>setForm({...form,descriere:e.target.value})} style={{resize:'vertical',minHeight:'60px'}} />
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Familie</label>
              <select value={form.familie||'BMF'} onChange={e=>setForm({...form,familie:e.target.value})}>
                <option>BMF</option><option>50BOYS</option><option>Afacere</option><option>Toate</option>
              </select>
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Deadline</label>
              <input type="text" placeholder="ex: 25.06.2026" value={form.deadline||''} onChange={e=>setForm({...form,deadline:e.target.value})} />
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Progres (%)</label>
              <input type="number" min="0" max="100" value={form.progres||0} onChange={e=>setForm({...form,progres:e.target.value})} />
            </>)}

            {modal.type==='invoire' && (<>
              <h3 style={{fontSize:'14px',fontWeight:500,color:'#7dc8ff',marginBottom:'1rem'}}>Depune invoire</h3>
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px'}}>Membru</label>
              <select value={form.memberSel||''} onChange={e=>setForm({...form,memberSel:e.target.value})}>
                <option value="">Selecteaza membru</option>
                {allMembersForInvoire.map(m=><option key={m.id} value={`${m.id}|${m.family}`}>{m.nome} ({m.family})</option>)}
              </select>
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Data inceput</label>
              <input type="text" placeholder="ex: 22.06.2026" value={form.dataInceput||''} onChange={e=>setForm({...form,dataInceput:e.target.value})} />
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Data sfarsit</label>
              <input type="text" placeholder="ex: 24.06.2026" value={form.dataSfarsit||''} onChange={e=>setForm({...form,dataSfarsit:e.target.value})} />
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Motiv</label>
              <textarea placeholder="Motivul invoirii..." value={form.motiv||''} onChange={e=>setForm({...form,motiv:e.target.value})} style={{resize:'vertical',minHeight:'60px'}} />
            </>)}

            {modal.type==='addUser' && (<>
              <h3 style={{fontSize:'14px',fontWeight:500,color:'#7dc8ff',marginBottom:'1rem'}}>Creeaza cont nou</h3>
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px'}}>Email</label>
              <input type="email" placeholder="email@exemplu.com" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} />
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Username</label>
              <input type="text" placeholder="ex: goku_bmf" value={form.username||''} onChange={e=>setForm({...form,username:e.target.value})} />
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Parola initiala</label>
              <input type="text" placeholder="min 6 caractere" value={form.password||''} onChange={e=>setForm({...form,password:e.target.value})} />
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Familie</label>
              <select value={form.family||'bmf'} onChange={e=>setForm({...form,family:e.target.value})}>
                <option value="bmf">BMF</option><option value="50boys">50BOYS</option><option value="afacere">Afacere</option>
              </select>
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Rank</label>
              <select value={form.rank||'Youngin'} onChange={e=>setForm({...form,rank:e.target.value})}>
                {[...RANKS.bmf,...RANKS['50boys'],...RANKS.afacere].filter((v,i,a)=>a.indexOf(v)===i).map(r=><option key={r} value={r}>{r}</option>)}
              </select>
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Permisiuni</label>
              <select value={form.can_edit?'edit':'view'} onChange={e=>setForm({...form,can_edit:e.target.value==='edit'})}>
                <option value="view">Doar vizualizare</option>
                <option value="edit">Poate edita familia lui</option>
              </select>
              <label style={{display:'block',fontSize:'10px',color:'#666',marginBottom:'4px',marginTop:'10px'}}>Poate aproba invoiri</label>
              <select value={form.can_approve?'da':'nu'} onChange={e=>setForm({...form,can_approve:e.target.value==='da'})}>
                <option value="nu">Nu</option>
                <option value="da">Da (ex: Co-Lider)</option>
              </select>
              {form.created && <div style={{color:'#4caf50',fontSize:'11px',marginTop:'8px',textAlign:'center'}}>Cont creat! Email: {form.email} / Parola: {form.password}</div>}
            </>)}

            <div style={{display:'flex',gap:'8px',marginTop:'1.2rem'}}>
              <button style={{flex:1,background:'transparent',border:'0.5px solid #2a2a2e',color:'#888',borderRadius:'7px',padding:'8px',fontSize:'12px',cursor:'pointer'}} onClick={()=>setModal(null)}>Anuleaza</button>
              <button className="btn-blue" style={{flex:1,padding:'8px',fontSize:'12px'}} disabled={saving}
                onClick={async()=>{
                  if(modal.type==='member') await handleSaveMember()
                  else if(modal.type==='trez') await handleSaveTrez()
                  else if(modal.type==='mission') await handleSaveMission()
                  else if(modal.type==='invoire') await handleSaveInvoire()
                  else if(modal.type==='addUser') {
                    setSaving(true)
                    const res = await fetch('/api/auth/create-user', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
                    const d = await res.json()
                    if(d.error) alert('Eroare: '+d.error)
                    else { setForm({...form,created:true}); await addLog(`${profile.username} a creat contul pentru ${form.username}`,'green') }
                    setSaving(false)
                  }
                }}>
                {saving ? 'Se salveaza...' : modal.type==='addUser'?'Creeaza cont':'Salveaza'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
