import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, CheckSquare, CalendarDays, Workflow, Settings, Search, Plus,
  Bell, ChevronDown, Menu, X, MoreHorizontal, ArrowUpRight, Clock3, CircleCheck,
  CircleAlert, ListTodo, SlidersHorizontal, Trash2, Pencil, Zap, Sparkles
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { api } from "./api";

const initialTasks = [
  { _id:"demo1", title:"Review project requirements", description:"Finalize scope and acceptance criteria", status:"in-progress", priority:"high", project:"Website redesign", dueDate:new Date(Date.now()+86400000).toISOString() },
  { _id:"demo2", title:"Prepare weekly progress report", description:"Summarize completed work and blockers", status:"todo", priority:"medium", project:"Operations", dueDate:new Date(Date.now()+2*86400000).toISOString() },
  { _id:"demo3", title:"Update landing page content", description:"Polish copy and review responsive layout", status:"done", priority:"low", project:"Website redesign", dueDate:new Date(Date.now()-86400000).toISOString() },
];
const nav = [
  { id:"overview", label:"Overview", icon:LayoutDashboard },
  { id:"tasks", label:"My tasks", icon:CheckSquare },
  { id:"board", label:"Board view", icon:Workflow },
  { id:"calendar", label:"Schedule", icon:CalendarDays },
];
const statusLabels = { todo:"To do", "in-progress":"In progress", done:"Completed", overdue:"Overdue" };
const dateLabel = (value) => value ? new Date(value).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "No deadline";
const isLate = (task) => task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date();

export default function App() {
  const [tasks,setTasks] = useState([]);
  const [notifications,setNotifications] = useState([]);
  const [page,setPage] = useState("overview");
  const [search,setSearch] = useState("");
  const [filter,setFilter] = useState("all");
  const [modal,setModal] = useState(false);
  const [editing,setEditing] = useState(null);
  const [menuOpen,setMenuOpen] = useState(false);
  const [notice,setNotice] = useState("");
  const [loading,setLoading] = useState(true);
  const [form,setForm] = useState({title:"",description:"",priority:"medium",project:"Personal",dueDate:""});
  const [apiReady,setApiReady] = useState(true);

  async function refresh() {
    try {
      const [taskData,noticeData] = await Promise.all([api.tasks(),api.notifications()]);
      setTasks(taskData); setNotifications(noticeData); setApiReady(true);
    } catch {
      setApiReady(false);
      setTasks(prev => prev.length ? prev : initialTasks);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ refresh(); const timer=setInterval(refresh,30000); return ()=>clearInterval(timer); },[]);

  const filtered = useMemo(()=>tasks.filter(t=>{
    const matches = `${t.title} ${t.description||""} ${t.project||""}`.toLowerCase().includes(search.toLowerCase());
    return matches && (filter==="all" || t.status===filter);
  }),[tasks,search,filter]);
  const stats = useMemo(()=>({
    total:tasks.length, done:tasks.filter(t=>t.status==="done").length,
    progress:tasks.filter(t=>t.status==="in-progress").length,
    overdue:tasks.filter(t=>isLate(t)||t.status==="overdue").length
  }),[tasks]);
  const completion = stats.total ? Math.round(stats.done/stats.total*100) : 0;
  const chartData = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day,i)=>({day,done:Math.max(0,Math.min(stats.done,Math.round(stats.done*(i+1)/7)))}));

  function openCreate() {
    setEditing(null); setForm({title:"",description:"",priority:"medium",project:"Personal",dueDate:""}); setModal(true);
  }
  function openEdit(task) {
    setEditing(task); setForm({title:task.title,description:task.description||"",priority:task.priority,project:task.project||"Personal",dueDate:task.dueDate?new Date(task.dueDate).toISOString().slice(0,10):""}); setModal(true);
  }
  async function saveTask(e) {
    e.preventDefault();
    try {
      const body={...form,dueDate:form.dueDate?new Date(`${form.dueDate}T23:59:00`).toISOString():null};
      if(editing) await api.updateTask(editing._id,body); else await api.createTask(body);
      setModal(false); await refresh(); setNotice(editing?"Task updated":"Task created");
    } catch(err) { setNotice(apiReady?err.message:"Start the backend to save tasks"); }
  }
  async function changeStatus(task,status) {
    if(String(task._id).startsWith("demo")) { setTasks(prev=>prev.map(t=>t._id===task._id?{...t,status}:t)); return; }
    try { await api.updateTask(task._id,{status}); await refresh(); } catch(err){setNotice(err.message);}
  }
  async function removeTask(task) {
    if(!confirm(`Delete "${task.title}"?`)) return;
    try { await api.deleteTask(task._id); await refresh(); } catch(err){setNotice(err.message);}
  }
  async function markRead(item) {
    try { await api.readNotification(item._id); await refresh(); } catch {}
  }

  const pageTitle = {overview:"Good afternoon, Châu",tasks:"My tasks",board:"Board view",calendar:"Your schedule"}[page];
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen?"sidebar-open":""}`}>
      <div className="brand"><div className="brand-mark"><Zap size={20} fill="currentColor"/></div><span>flowtask</span><button className="mobile-close icon-btn" onClick={()=>setMenuOpen(false)}><X size={19}/></button></div>
      <div className="workspace"><div className="workspace-avatar">C</div><div><strong>Châu's workspace</strong><small>Personal plan</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(item=><button key={item.id} className={`nav-item ${page===item.id?"active":""}`} onClick={()=>{setPage(item.id);setMenuOpen(false)}}><item.icon size={18}/><span>{item.label}</span>{item.id==="tasks"&&<small>{tasks.length}</small>}</button>)}</nav>
      <div className="nav-label projects-label">YOUR SPACE</div>
      <button className="nav-item" onClick={()=>setPage("tasks")}><span className="project-dot purple"></span><span>Website redesign</span></button>
      <button className="nav-item" onClick={()=>setPage("tasks")}><span className="project-dot orange"></span><span>Personal</span></button>
      <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><strong>Make room for focus</strong><p>Small steps add up to big progress.</p><button onClick={openCreate}>Create a task <ArrowUpRight size={14}/></button></div><button className="nav-item"><Settings size={18}/><span>Settings</span></button><div className="profile"><div className="profile-avatar">C</div><div><strong>Châu Nguyễn</strong><small>Personal workspace</small></div><MoreHorizontal size={18}/></div></div>
    </aside>
    {menuOpen&&<div className="scrim" onClick={()=>setMenuOpen(false)} />}
    <main className="main">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMenuOpen(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>{page==="overview"?"Overview":pageTitle}</b></div><div className="top-actions"><label className="top-search"><Search size={16}/><input placeholder="Search anything..." value={search} onChange={e=>setSearch(e.target.value)}/><kbd>⌘ K</kbd></label><div className="notification-wrap"><button className="icon-btn notification-btn" onClick={()=>setPage("tasks")}><Bell size={19}/>{notifications.some(n=>!n.read)&&<i/>}</button></div><div className="top-avatar">C</div></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">FRIDAY, NOVEMBER 13, 2026</div><h1>{pageTitle}</h1><p>Here’s what’s happening with your work today.</p></div><button className="primary-btn" onClick={openCreate}><Plus size={17}/> New task</button></div>
        {!apiReady&&<div className="demo-banner"><CircleAlert size={17}/> Preview mode — start the backend and MongoDB to save changes permanently.</div>}
        {notice&&<div className="toast" onClick={()=>setNotice("")}>{notice} <X size={14}/></div>}
        {page==="overview"&&<Overview stats={stats} completion={completion} chartData={chartData} tasks={tasks} onCreate={openCreate} onStatus={changeStatus} onEdit={openEdit}/>}
        {page==="tasks"&&<TaskList tasks={filtered} filter={filter} setFilter={setFilter} onStatus={changeStatus} onEdit={openEdit} onDelete={removeTask}/>}
        {page==="board"&&<Board tasks={tasks} onStatus={changeStatus} onEdit={openEdit}/>}
        {page==="calendar"&&<Schedule tasks={tasks}/>}
        {notifications.length>0&&<section className="notifications-panel"><div className="section-head"><div><h3>Recent notifications</h3><p>Stay on top of your deadlines</p></div><span className="subtle-link">{notifications.filter(n=>!n.read).length} unread</span></div>{notifications.slice(0,4).map(n=><div className="notification-row" key={n._id}><div className={`notification-icon ${n.type}`}><Bell size={16}/></div><div className="notification-copy"><b>{n.title}</b><p>{n.message}</p></div>{!n.read&&<button className="text-btn" onClick={()=>markRead(n)}>Mark read</button>}</div>)}</section>}
      </div>
    </main>
    {modal&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setModal(false)}><form className="task-modal" onSubmit={saveTask}><div className="modal-head"><div><span className="eyebrow">TASK DETAILS</span><h2>{editing?"Edit task":"Create a new task"}</h2></div><button type="button" className="icon-btn" onClick={()=>setModal(false)}><X/></button></div><label>Task name<input required maxLength="120" placeholder="e.g. Finish project proposal" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Description<textarea rows="3" placeholder="Add a few details..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div className="form-grid"><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Due date<input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></label></div><label>Project<input value={form.project} onChange={e=>setForm({...form,project:e.target.value})} placeholder="Personal"/></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setModal(false)}>Cancel</button><button className="primary-btn" type="submit">{editing?"Save changes":"Create task"}</button></div></form></div>}
  </div>;
}

function Overview({stats,completion,chartData,tasks,onCreate,onStatus,onEdit}) {
  const cards=[
    {label:"Total tasks",value:stats.total,sub:"Across all projects",icon:ListTodo,tone:"violet"},
    {label:"In progress",value:stats.progress,sub:"Work in motion",icon:Clock3,tone:"blue"},
    {label:"Completed",value:stats.done,sub:"Nice work, keep going",icon:CircleCheck,tone:"green"},
    {label:"Overdue",value:stats.overdue,sub:"Needs your attention",icon:CircleAlert,tone:"orange"},
  ];
  const upcoming=tasks.filter(t=>t.status!=="done").sort((a,b)=>new Date(a.dueDate||"2999")-new Date(b.dueDate||"2999")).slice(0,4);
  return <>
    <div className="stats-grid">{cards.map(c=><div className="stat-card" key={c.label}><div className={`stat-icon ${c.tone}`}><c.icon size={19}/></div><span>{c.label}</span><strong>{c.value}</strong><small>{c.sub}</small></div>)}</div>
    <div className="overview-grid"><section className="panel progress-panel"><div className="section-head"><div><h3>Productivity overview</h3><p>Your task completion at a glance</p></div><span className="period-pill">This week <ChevronDown size={13}/></span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7668ed" stopOpacity={.22}/><stop offset="100%" stopColor="#7668ed" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#eff0f5" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:"#9a9bad",fontSize:11}}/><Tooltip/><Area type="monotone" dataKey="done" stroke="#7668ed" strokeWidth={2.5} fill="url(#chartFill)"/></AreaChart></ResponsiveContainer></div><div className="chart-footer"><div><span className="chart-dot"/><span>Tasks completed</span></div><b>{completion}% <small>overall completion</small></b></div></section>
    <section className="panel completion-panel"><div className="section-head"><div><h3>Task progress</h3><p>Keep your momentum going</p></div><MoreHorizontal size={19} color="#9b9bad"/></div><div className="donut" style={{"--progress":`${completion*3.6}deg`}}><div><strong>{completion}%</strong><span>Completed</span></div></div><div className="progress-legend"><div><i className="legend-purple"/><span>Completed</span><b>{stats.done}</b></div><div><i className="legend-blue"/><span>In progress</span><b>{stats.progress}</b></div><div><i className="legend-gray"/><span>To do</span><b>{stats.total-stats.done-stats.progress-stats.overdue}</b></div></div></section></div>
    <section className="panel upcoming-panel"><div className="section-head"><div><h3>Upcoming tasks</h3><p>A little progress each day adds up</p></div><button className="subtle-link" onClick={onCreate}>+ Add task</button></div>{upcoming.length===0?<Empty/>:upcoming.map(t=><TaskRow key={t._id} task={t} onStatus={onStatus} onEdit={onEdit}/>)}</section>
  </>;
}
function TaskRow({task,onStatus,onEdit}) {
  return <div className="task-row"><button className={`check-circle ${task.status==="done"?"checked":""}`} onClick={()=>onStatus(task,task.status==="done"?"todo":"done")}>{task.status==="done"&&<CircleCheck size={16}/>}</button><div className="task-row-main"><b className={task.status==="done"?"completed-text":""}>{task.title}</b><span>{task.project||"Personal"}</span></div><span className={`priority ${task.priority}`}>{task.priority}</span><span className={`due-date ${isLate(task)?"late":""}`}><CalendarDays size={14}/>{dateLabel(task.dueDate)}</span><button className="icon-btn row-edit" onClick={()=>onEdit(task)}><Pencil size={15}/></button></div>;
}
function TaskList({tasks,filter,setFilter,onStatus,onEdit,onDelete}) {
  return <section className="panel task-list-panel"><div className="task-toolbar"><div className="filter-tabs">{["all","todo","in-progress","done","overdue"].map(f=><button className={filter===f?"selected":""} onClick={()=>setFilter(f)} key={f}>{f==="all"?"All":statusLabels[f]}</button>)}</div><button className="filter-button"><SlidersHorizontal size={15}/> Filters</button></div>{tasks.length===0?<Empty/>:tasks.map(t=><div className="task-row" key={t._id}><button className={`check-circle ${t.status==="done"?"checked":""}`} onClick={()=>onStatus(t,t.status==="done"?"todo":"done")}>{t.status==="done"&&<CircleCheck size={16}/>}</button><div className="task-row-main"><b>{t.title}</b><span>{t.project||"Personal"} · {statusLabels[t.status]}</span></div><span className={`priority ${t.priority}`}>{t.priority}</span><span className={`due-date ${isLate(t)?"late":""}`}><CalendarDays size={14}/>{dateLabel(t.dueDate)}</span><button className="icon-btn" onClick={()=>onEdit(t)}><Pencil size={15}/></button><button className="icon-btn delete-btn" onClick={()=>onDelete(t)}><Trash2 size={15}/></button></div>)}</section>;
}
function Board({tasks,onStatus,onEdit}) {
  const columns=[{id:"todo",title:"To do",color:"gray"},{id:"in-progress",title:"In progress",color:"blue"},{id:"done",title:"Completed",color:"green"},{id:"overdue",title:"Overdue",color:"orange"}];
  return <div className="kanban">{columns.map(col=><section className="kanban-col" key={col.id} onDragOver={e=>e.preventDefault()} onDrop={e=>{const id=e.dataTransfer.getData("task");const task=tasks.find(t=>t._id===id);if(task)onStatus(task,col.id)}}><div className="kanban-head"><span className={`column-dot ${col.color}`}/><b>{col.title}</b><small>{tasks.filter(t=>t.status===col.id).length}</small></div>{tasks.filter(t=>t.status===col.id).map(t=><article className="kanban-card" draggable onDragStart={e=>e.dataTransfer.setData("task",t._id)} key={t._id}><div className="kanban-card-top"><span className={`priority ${t.priority}`}>{t.priority}</span><button className="icon-btn" onClick={()=>onEdit(t)}><MoreHorizontal size={16}/></button></div><b>{t.title}</b><p>{t.description||"No description added."}</p><div className="kanban-card-foot"><span>{t.project||"Personal"}</span><span><CalendarDays size={13}/>{dateLabel(t.dueDate)}</span></div></article>)}</section>)}</div>;
}
function Schedule({tasks}) {
  const grouped=tasks.filter(t=>t.dueDate).sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).reduce((acc,t)=>{const key=new Date(t.dueDate).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});(acc[key]??=[]).push(t);return acc;},{});
  return <section className="panel schedule-panel"><div className="section-head"><div><h3>Upcoming deadlines</h3><p>Your tasks, organized by due date</p></div><CalendarDays color="#7668ed"/></div>{Object.keys(grouped).length===0?<Empty/>:Object.entries(grouped).map(([day,items])=><div className="schedule-day" key={day}><b>{day}</b>{items.map(t=><div className="schedule-item" key={t._id}><span className={`column-dot ${t.status==="done"?"green":t.status==="in-progress"?"blue":"gray"}`}/><div><strong>{t.title}</strong><small>{t.project}</small></div><span className={`priority ${t.priority}`}>{t.priority}</span></div>)}</div>)}</section>;
}
function Empty(){return <div className="empty-state"><div><CheckSquare size={22}/></div><b>Nothing on your plate</b><p>When you add tasks, they’ll show up here.</p></div>;}
