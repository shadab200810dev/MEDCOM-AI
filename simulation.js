/*
 * MEDCOM standalone prototype data layer.
 * All records are synthetic and kept in this browser; no server is required.
 */
const MEDCOM_STORAGE_KEY = 'medcom-ai-prototype-v1';

function localTime() {
  return new Date().toLocaleTimeString('en-GB', {hour12:false});
}

function initialScenario() {
  const now = localTime();
  const updated = now.slice(0, 5);
  const patients = [
    {id:'PT-1042',sector:'NORTH RIDGE',node:'A',status:'STABLE',reviewed:false,observations:{heart_rate:92,spo2:97,respiratory_rate:18,temperature:37.1},history:[{at:'14:02',hr:88,spo2:98},{at:'14:11',hr:90,spo2:97},{at:'14:20',hr:92,spo2:97}],updated_at:updated},
    {id:'PT-1048',sector:'EAST PASS',node:'D',status:'MONITOR',reviewed:false,observations:{heart_rate:118,spo2:91,respiratory_rate:25,temperature:38.2},history:[{at:'13:58',hr:104,spo2:94},{at:'14:09',hr:111,spo2:93},{at:'14:20',hr:118,spo2:91}],updated_at:updated},
    {id:'PT-1051',sector:'SOUTH BASIN',node:'G',status:'STABLE',reviewed:true,observations:{heart_rate:84,spo2:98,respiratory_rate:16,temperature:36.8},history:[{at:'13:59',hr:86,spo2:97},{at:'14:10',hr:85,spo2:98},{at:'14:20',hr:84,spo2:98}],updated_at:updated},
    {id:'PT-1057',sector:'WEST CUT',node:'H',status:'PRIORITY',reviewed:false,observations:{heart_rate:132,spo2:88,respiratory_rate:29,temperature:39.0},history:[{at:'13:58',hr:119,spo2:92},{at:'14:09',hr:127,spo2:90},{at:'14:20',hr:132,spo2:88}],updated_at:updated},
    {id:'PT-1063',sector:'CENTRAL',node:'E',status:'STABLE',reviewed:false,observations:{heart_rate:98,spo2:95,respiratory_rate:20,temperature:37.4},history:[{at:'14:00',hr:96,spo2:96},{at:'14:10',hr:97,spo2:95},{at:'14:20',hr:98,spo2:95}],updated_at:updated}
  ];
  const events = [
    {id:'EVT-001',type:'SYSTEM',description:'Scenario initialized · Sector Kestrel',target:'SYSTEM',severity:'LOW',time:now,status:'ACTIVE'},
    {id:'EVT-002',type:'ROAD',description:'ROAD-04 closure reported · bridge inspection',target:'ROAD-04',severity:'HIGH',time:now,status:'ACTIVE'},
    {id:'EVT-003',type:'MISSION',description:'Mission ongoing · Operation Kestrel',target:'OPERATION KESTREL',severity:'LOW',time:now,status:'ACTIVE'}
  ];
  return {
    patients,
    facilities:[
      {id:'FAC-01',name:'Forward Aid Station',node:'F',available:true,capabilities:['TRAUMA','STABILIZATION']},
      {id:'FAC-02',name:'Field Medical Unit',node:'G',available:true,capabilities:['TRAUMA','SURGICAL']},
      {id:'FAC-03',name:'Regional Care Point',node:'H',available:false,capabilities:['ADVANCED CARE']}
    ],
    nodes:[
      {id:'A',x:80,y:125,name:'North Ridge'},{id:'B',x:255,y:75,name:'Highland Junction'},
      {id:'C',x:255,y:260,name:'West Fork'},{id:'D',x:470,y:55,name:'East Pass'},
      {id:'E',x:470,y:175,name:'Crossroads'},{id:'F',x:700,y:270,name:'Forward Aid Station'},
      {id:'G',x:700,y:115,name:'Field Medical Unit'},{id:'H',x:870,y:185,name:'West Cut'}
    ],
    roads:[
      {id:'ROAD-01',from:'A',to:'B',minutes:4,blocked:false},{id:'ROAD-02',from:'A',to:'C',minutes:7,blocked:false},
      {id:'ROAD-03',from:'B',to:'D',minutes:5,blocked:false},{id:'ROAD-04',from:'B',to:'E',minutes:5,blocked:true},
      {id:'ROAD-05',from:'C',to:'E',minutes:3,blocked:false},{id:'ROAD-06',from:'C',to:'F',minutes:8,blocked:false},
      {id:'ROAD-07',from:'D',to:'E',minutes:4,blocked:false},{id:'ROAD-08',from:'D',to:'G',minutes:6,blocked:false},
      {id:'ROAD-09',from:'E',to:'G',minutes:5,blocked:false},{id:'ROAD-10',from:'E',to:'H',minutes:7,blocked:false},
      {id:'ROAD-11',from:'F',to:'H',minutes:4,blocked:false},{id:'ROAD-12',from:'G',to:'H',minutes:3,blocked:false}
    ],
    routes:[],events,mission_status:'ONGOING',event_counter:3,
    analytics:{requests:0,success:0,failed:0,closures:0,missions_created:0,times_ms:[]}
  };
}

function encodeScenario(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}

function decodeScenario(value) {
  try {
    const base64 = value.replaceAll('-','+').replaceAll('_','/') + '='.repeat((4 - value.length % 4) % 4);
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && Array.isArray(parsed.patients) && Array.isArray(parsed.roads) && Array.isArray(parsed.events) ? parsed : null;
  } catch { return null; }
}

function loadScenario() {
  const fromUrl = new URLSearchParams(location.search).get('scenario');
  if (fromUrl) {
    const parsed = decodeScenario(fromUrl);
    if (parsed) return parsed;
  }
  try {
    const saved = localStorage.getItem(MEDCOM_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.patients) && Array.isArray(parsed.roads) && Array.isArray(parsed.events)) return parsed;
    }
  } catch { /* file:// storage may be restricted; navigation links carry the demo state */ }
  return initialScenario();
}

let scenario = loadScenario();

function saveScenario() {
  const serialized = JSON.stringify(scenario);
  try { localStorage.setItem(MEDCOM_STORAGE_KEY, serialized); } catch { /* URL state is the local-file fallback */ }
  try {
    const current = new URL(location.href);
    current.searchParams.set('scenario', encodeScenario(scenario));
    history.replaceState(null, '', current.href);
  } catch { /* Some file viewers do not allow history URL updates */ }
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function priorityFor(patient) {
  const obs = patient.observations;
  const flags = [];
  if (obs.spo2 < 90) flags.push({rule:'Oxygen saturation below 90%',observation:`SpO₂ ${obs.spo2}%`});
  if (obs.heart_rate >= 125) flags.push({rule:'Heart rate at or above 125 bpm',observation:`HR ${obs.heart_rate} bpm`});
  if (obs.respiratory_rate >= 28) flags.push({rule:'Respiratory rate at or above 28/min',observation:`RR ${obs.respiratory_rate}/min`});
  return {level:flags.length>=2?'CRITICAL':flags.length?'URGENT':'ROUTINE',flags,note:'Demonstration rules only · not a clinical assessment'};
}

function withPriority(patient) { return {...patient,priority:priorityFor(patient)}; }

function recordEvent(type, description, target, severity, status='ACTIVE') {
  scenario.event_counter = (scenario.event_counter || scenario.events.length) + 1;
  scenario.events.unshift({id:`EVT-${String(scenario.event_counter).padStart(3,'0')}`,type,description,target,severity,time:localTime(),status});
  scenario.events = scenario.events.slice(0, 100);
}

function dijkstra(start, goal) {
  const graph = new Map();
  scenario.roads.filter(road=>!road.blocked).forEach(road=>{
    if (!graph.has(road.from)) graph.set(road.from,[]);
    if (!graph.has(road.to)) graph.set(road.to,[]);
    graph.get(road.from).push({node:road.to,weight:road.minutes,road:road.id});
    graph.get(road.to).push({node:road.from,weight:road.minutes,road:road.id});
  });
  const queue=[{node:start,cost:0,road_ids:[],nodes:[start]}],best=new Map();
  while(queue.length){
    queue.sort((a,b)=>a.cost-b.cost||a.node.localeCompare(b.node));
    const current=queue.shift();
    if(best.has(current.node))continue;
    best.set(current.node,current.cost);
    if(current.node===goal)return {minutes:current.cost,road_ids:current.road_ids,nodes:current.nodes,segments:current.road_ids.length};
    (graph.get(current.node)||[]).forEach(edge=>{if(!best.has(edge.node))queue.push({node:edge.node,cost:current.cost+edge.weight,road_ids:[...current.road_ids,edge.road],nodes:[...current.nodes,edge.node]});});
  }
  return null;
}

function dashboardData() {
  const patients=scenario.patients;
  return {
    active_patients:patients.length,
    priority_cases:patients.filter(patient=>['URGENT','CRITICAL'].includes(priorityFor(patient).level)).length,
    available_facilities:scenario.facilities.filter(facility=>facility.available).length,
    active_hazards:scenario.roads.filter(road=>road.blocked).length,
    active_evacuations:scenario.routes.filter(route=>route.mission_status==='ONGOING').length,
    patients:patients.map(withPriority),
    events:scenario.events.filter(event=>event.type!=='MISSION'||event.status==='ACTIVE').slice(0,6)
  };
}

function analyticsData() {
  const metrics=scenario.analytics,times=metrics.times_ms;
  return {
    mission_status:scenario.mission_status,
    requests:metrics.requests,success:metrics.success,failed:metrics.failed,closures:metrics.closures,
    average_ms:times.length?Math.round(times.reduce((sum,value)=>sum+value,0)/times.length*100)/100:0,
    times_ms:times,open_roads:scenario.roads.filter(road=>!road.blocked).length,
    blocked_roads:scenario.roads.filter(road=>road.blocked).length,
    patients:scenario.patients.length,facilities:scenario.facilities.length,
    recalculations:scenario.events.filter(event=>event.type==='RECALCULATED').length
  };
}

function calculateForMission(patient, facility) {
  const started=performance.now();
  const result=dijkstra(patient.node,facility.node);
  const elapsed=Math.max(0,Math.round((performance.now()-started)*1000)/1000);
  scenario.analytics.requests++;
  scenario.analytics.times_ms.push(elapsed);
  return {result,elapsed};
}

async function api(url, options={}) {
  const method=(options.method||'GET').toUpperCase();
  const path=url.split('?')[0];
  const body=options.body?JSON.parse(options.body):{};
  let result;

  if(path==='/api/events'&&method==='GET')result=clone(scenario.events);
  else if(path==='/api/dashboard'&&method==='GET')result=dashboardData();
  else if(path==='/api/analytics'&&method==='GET')result=analyticsData();
  else if(path==='/api/patients'&&method==='GET')result=scenario.patients.map(withPriority);
  else if(path==='/api/facilities'&&method==='GET')result=clone(scenario.facilities);
  else if(path==='/api/roads'&&method==='GET')result={nodes:clone(scenario.nodes),roads:clone(scenario.roads),patients:scenario.patients.map(withPriority),facilities:clone(scenario.facilities),routes:clone(scenario.routes)};
  else if(path==='/api/missions'&&method==='GET')result=clone([...scenario.routes].sort((a,b)=>b.created_at.localeCompare(a.created_at)));
  else if(path==='/api/patients'&&method==='POST'){
    const sector=String(body.sector||'').trim().toUpperCase(),node=String(body.node||'').trim().toUpperCase(),status=String(body.status||'STABLE').toUpperCase();
    const hr=Number(body.heart_rate),spo2=Number(body.spo2),rr=Number(body.respiratory_rate),temperature=Number(body.temperature);
    if(!sector||sector.length>40)throw new Error('Enter an incident sector of 1 to 40 characters');
    if(!['STABLE','MONITOR','PRIORITY'].includes(status))throw new Error('Choose Stable, Monitor, or Priority as the simulated status');
    if(!Number.isInteger(hr)||!Number.isInteger(spo2)||!Number.isInteger(rr)||!Number.isFinite(temperature)||hr<30||hr>250||spo2<50||spo2>100||rr<4||rr>70||temperature<30||temperature>45)throw new Error('Observations are outside the supported simulation ranges');
    if(!scenario.nodes.some(item=>item.id===node))throw new Error('Choose a valid network location');
    const next=Math.max(1000,...scenario.patients.map(patient=>Number(patient.id.replace('PT-',''))||0))+1,now=localTime();
    const patient={id:`PT-${String(next).padStart(4,'0')}`,sector,node,status,reviewed:false,observations:{heart_rate:hr,spo2,respiratory_rate:rr,temperature:Math.round(temperature*10)/10},history:[{at:now.slice(0,5),hr,spo2}],updated_at:now.slice(0,5)};
    scenario.patients.push(patient);recordEvent('PATIENT',`Synthetic patient record added · ${patient.id}`,patient.id,'LOW');result=withPriority(patient);
  }
  else if(/^\/api\/patients\/[^/]+$/.test(path)&&method==='GET'){
    const patient=scenario.patients.find(item=>item.id===decodeURIComponent(path.split('/').pop()));
    if(!patient)throw new Error('Patient not found');result=withPriority(patient);
  }
  else if(/^\/api\/patients\/[^/]+\/review$/.test(path)&&method==='POST'){
    const id=decodeURIComponent(path.split('/')[3]),patient=scenario.patients.find(item=>item.id===id);
    if(!patient)throw new Error('Patient not found');patient.reviewed=true;recordEvent('REVIEW',`${id} marked reviewed`,id,'LOW');result={ok:true,patient:clone(patient)};
  }
  else if(/^\/api\/patients\/[^/]+\/condition$/.test(path)&&method==='POST'){
    const id=decodeURIComponent(path.split('/')[3]),patient=scenario.patients.find(item=>item.id===id);
    const condition=String(body.condition||'').toUpperCase().trim(),note=String(body.note||'').trim();
    if(!patient)throw new Error('Patient not found');
    if(!['STABLE','MONITOR','PRIORITY'].includes(condition))throw new Error('Choose Stable, Monitor, or Priority as the reported condition');
    if(note.length>500)throw new Error('Condition note must be 500 characters or fewer');
    const now=localTime();patient.status=condition;patient.updated_at=now.slice(0,5);patient.last_condition_report={condition,note,time:now};
    recordEvent('CONDITION',`Condition reported · ${id} · ${condition}${note?` · ${note.slice(0,100)}`:''}`,id,condition==='PRIORITY'?'HIGH':condition==='MONITOR'?'MEDIUM':'LOW');result=withPriority(patient);
  }
  else if(path==='/api/routes/calculate'&&method==='POST'){
    const patient=scenario.patients.find(item=>item.id===body.patient_id),facility=scenario.facilities.find(item=>item.id===body.facility_id);
    if(!patient||!facility)throw new Error('Select a valid patient and facility');
    if(!facility.available)throw new Error('That facility is currently unavailable');
    const {result:routeResult,elapsed}=calculateForMission(patient,facility);
    let active=scenario.routes.find(route=>route.patient_id===patient.id&&route.mission_status==='ONGOING');
    if(!routeResult){scenario.analytics.failed++;if(active){active={...active,status:'NO ROUTE',road_ids:[],nodes:[],segments:0,minutes:null,elapsed_ms:elapsed,facility:facility.name,facility_id:facility.id};Object.assign(scenario.routes.find(route=>route.id===active.id),active);recordEvent('NO ROUTE',`No valid route remains for ${patient.id} → ${facility.name}`,active.id,'HIGH');result={...clone(active),message:'No valid route is available with current road conditions.'};}else{recordEvent('NO ROUTE',`No valid route for ${patient.id} → ${facility.name}`,patient.id,'HIGH');result={status:'NO ROUTE',message:'No valid route is available with current road conditions.',elapsed_ms:elapsed};}}
    else {
      const wasActive=Boolean(active);
      if(active)Object.assign(active,{patient_sector:patient.sector,facility_id:facility.id,facility:facility.name,status:'IN PROGRESS',elapsed_ms:elapsed,...routeResult});
      else {scenario.analytics.missions_created++;active={id:`EVAC-${String(scenario.analytics.missions_created).padStart(3,'0')}`,patient_id:patient.id,patient_sector:patient.sector,facility_id:facility.id,facility:facility.name,status:'IN PROGRESS',mission_status:'ONGOING',created_at:localTime(),completed_at:null,elapsed_ms:elapsed,...routeResult};scenario.routes.push(active);recordEvent('MISSION',`Evacuation mission ongoing · ${active.id} · ${patient.id} to ${facility.name}`,active.id,'LOW','ACTIVE');}
      scenario.analytics.success++;recordEvent(wasActive?'RECALCULATED':'ROUTE',`Route ${active.id} ${wasActive?'recalculated':'calculated'} · ${patient.id} to ${facility.name}`,active.id,'MEDIUM');result=clone(active);
    }
  }
  else if(/^\/api\/roads\/[^/]+\/(block|restore)$/.test(path)&&method==='POST'){
    const [,roadId,action]=path.match(/^\/api\/roads\/([^/]+)\/(block|restore)$/)||[],road=scenario.roads.find(item=>item.id===decodeURIComponent(roadId||''));
    if(!road)throw new Error('Road not found');road.blocked=action==='block';
    if(action==='block')scenario.analytics.closures++;
    else scenario.events.forEach(event=>{if(event.type==='ROAD'&&event.target===road.id&&event.status==='ACTIVE')event.status='RESOLVED';});
    recordEvent('ROAD',`${road.id} ${action==='block'?'blocked':'restored'}`,road.id,action==='block'?'HIGH':'LOW',action==='block'?'ACTIVE':'RESOLVED');
    const updated=[];
    scenario.routes.filter(route=>route.mission_status==='ONGOING'&&route.status==='IN PROGRESS'&&route.road_ids.includes(road.id)).forEach(route=>{
      const patient=scenario.patients.find(item=>item.id===route.patient_id),facility=scenario.facilities.find(item=>item.id===route.facility_id);
      if(!patient||!facility)return;const {result:replacement,elapsed}=calculateForMission(patient,facility);route.elapsed_ms=elapsed;
      if(!replacement){scenario.analytics.failed++;Object.assign(route,{status:'NO ROUTE',road_ids:[],nodes:[],segments:0,minutes:null});recordEvent('NO ROUTE',`No route remains for ${patient.id}`,patient.id,'HIGH');}
      else{scenario.analytics.success++;Object.assign(route,replacement,{status:'IN PROGRESS'});recordEvent('RECALCULATED',`Route updated for ${patient.id} · ${replacement.minutes} min`,route.id,'MEDIUM');}
      updated.push(clone(route));
    });
    result={road:clone(road),updated_routes:updated};
  }
  else if(/^\/api\/missions\/[^/]+\/complete$/.test(path)&&method==='POST'){
    const id=decodeURIComponent(path.split('/')[3]),mission=scenario.routes.find(item=>item.id===id);
    if(!mission)throw new Error('Evacuation mission not found');
    if(mission.mission_status==='COMPLETED')result={mission:clone(mission),changed:false};
    else{mission.mission_status='COMPLETED';mission.status='COMPLETED';mission.completed_at=localTime();scenario.events.forEach(event=>{if(event.type==='MISSION'&&event.target===id&&event.status==='ACTIVE')event.status='RESOLVED';});recordEvent('MISSION',`Evacuation mission completed · ${id} · ${mission.patient_id} to ${mission.facility}`,id,'LOW','RESOLVED');result={mission:clone(mission),changed:true};}
  }
  else if(path==='/api/mission/status'&&method==='POST'){
    const status=String(body.status||'').toUpperCase().trim();if(!['ONGOING','COMPLETED'].includes(status))throw new Error('Mission status must be Ongoing or Completed');
    const changed=scenario.mission_status!==status;
    if(changed){scenario.mission_status=status;scenario.events.forEach(event=>{if(event.type==='MISSION'&&event.target==='OPERATION KESTREL'&&event.status==='ACTIVE')event.status='RESOLVED';});recordEvent('MISSION',`Mission ${status.toLowerCase()} · Operation Kestrel`,'OPERATION KESTREL','LOW',status==='ONGOING'?'ACTIVE':'RESOLVED');}
    result={mission_status:scenario.mission_status,changed};
  }
  else if(path==='/api/simulation/reset'&&method==='POST'){
    scenario=initialScenario();recordEvent('SYSTEM','Scenario reset · initial synthetic data restored','SYSTEM','LOW');result={ok:true};
  }
  else throw new Error(`Prototype action not available: ${method} ${path}`);

  saveScenario();
  return clone(result);
}

/* Keep the synthetic state with file-based navigation as well as localStorage. */
saveScenario();
document.addEventListener('click', event => {
  const link=event.target.closest('a[href]');
  if(!link||link.target||event.defaultPrevented)return;
  const target=new URL(link.href,location.href);
  if(target.protocol!==location.protocol||!target.pathname.toLowerCase().endsWith('.html'))return;
  target.searchParams.set('scenario',encodeScenario(scenario));
  link.href=target.href;
},true);
