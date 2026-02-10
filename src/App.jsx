import './index.css';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Settings, 
  LayoutDashboard,
  UserPlus,
  RefreshCw,
  AlertCircle,
  Search,
  CheckSquare,
  Square,
  UserCircle,
  GripHorizontal,
  XCircle,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

/**
 * [환경 설정 참고]
 * 프리뷰 환경에서는 Tailwind CSS가 기본 제공되므로 별도의 CSS 임포트 없이 작동합니다.
 * 로컬 GitHub 프로젝트(Vite 등)에서 사용하실 때는 가이드에 따라 'import './index.css';'를 
 * 다시 추가하고 Tailwind 설정을 완료해 주세요.
 */

// --- Constants & Configuration ---
const LEADER_TYPES = {
  PRESIDENT: { label: '사장', color: 'bg-slate-900', text: 'text-white' },
  CEO: { label: '대표이사', color: 'bg-slate-700', text: 'text-white' },
  DIVISION: { label: '부문리더', color: 'bg-emerald-500', text: 'text-white' },
  GROUP: { label: '그룹리더', color: 'bg-orange-500', text: 'text-white' },
  TEAM: { label: '팀리더', color: 'bg-amber-400', text: 'text-gray-900' },
};

const DEFAULT_LEVELS = [
  { id: 1, name: '부문', color: '#111827' }, 
  { id: 2, name: '그룹', color: '#7C3AED' }, 
  { id: 3, name: '팀', color: '#4B5563' },   
  { id: 4, name: '유닛', color: '#8B5CF6' },
  { id: 5, name: '파트', color: '#EC4899' },
];

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTVZk83gQBTMsxo5Jgm-Zg8dc25qi2k7Rt1olTlfIw0xjL1OsWqYGiTYcJ1qU5LJkw9DdBSHzTS38a6/pub?gid=0&single=true&output=csv";

const INITIAL_NODES = [
  {
    id: 'root-president',
    type: 'org',
    label: '사장',
    level: 0,
    parentId: null,
    isException: false,
    layout: 'standard'
  },
  {
    id: 'root-ceo',
    type: 'org',
    label: '대표이사',
    level: 1,
    parentId: 'root-president',
    isException: false,
    layout: 'standard'
  }
];

export default function App() {
  const [levels, setLevels] = useState(DEFAULT_LEVELS);
  const [employeePool, setEmployeePool] = useState([]);
  const [chartNodes, setChartNodes] = useState(INITIAL_NODES); 
  const [loading, setLoading] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('pool');
  const [draggedNode, setDraggedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    fetchData();
    return () => document.head.removeChild(link);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(CSV_URL);
      const text = await response.text();
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      const data = rows.slice(1).filter(r => r.length >= 5).map((r, i) => ({
        id: `emp-${i}`,
        no: r[0], division: r[1], group: r[2], team: r[3], name: r[4], position: r[5] || ''
      }));
      setEmployeePool(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const filteredPool = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return employeePool.filter(emp => 
      emp.name.toLowerCase().includes(lower) || emp.division.toLowerCase().includes(lower) || 
      emp.team.toLowerCase().includes(lower) || emp.position.toLowerCase().includes(lower)
    );
  }, [employeePool, searchTerm]);

  const selectAllFiltered = () => setSelectedIds(new Set(filteredPool.map(e => e.id)));
  const deselectAll = () => setSelectedIds(new Set());
  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const addNode = (parentId, type = 'org', isException = false, layout = 'standard', levelIdx = null) => {
    const parent = chartNodes.find(n => n.id === parentId);
    const newNodeId = `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const newNode = {
      id: newNodeId,
      type,
      label: isException ? '예외 조직' : (levelIdx !== null ? levels[levelIdx].name : '신규 조직'),
      level: isException ? -1 : (levelIdx !== null ? levelIdx + 1 : (parent ? parent.level + 1 : 1)),
      parentId,
      isException,
      layout,
    };

    setChartNodes(prev => [...prev, newNode]);
    setActiveMenu(null);
  };

  const addSelectedToOrg = (parentId) => {
    const selectedEmps = employeePool.filter(e => selectedIds.has(e.id));
    const newNodes = selectedEmps.map(emp => {
      const leaderRole = Object.keys(LEADER_TYPES).find(key => emp.position.includes(LEADER_TYPES[key].label));
      return {
        id: `person-${Date.now()}-${emp.id}-${Math.random()}`,
        type: 'person',
        label: emp.name,
        originalPosition: emp.position,
        role: leaderRole || null,
        parentId,
        level: -1
      };
    });
    setChartNodes(prev => [...prev, ...newNodes]);
    setSelectedIds(new Set());
  };

  const deleteNode = (id) => {
    if (id.startsWith('root-')) return;
    setChartNodes(prev => {
      const toDelete = new Set([id]);
      let size = 0;
      while (size !== toDelete.size) {
        size = toDelete.size;
        prev.forEach(n => { if (toDelete.has(n.parentId)) toDelete.add(n.id); });
      }
      return prev.filter(n => !toDelete.has(n.id));
    });
  };

  const updateLabel = (id, label) => setChartNodes(prev => prev.map(n => n.id === id ? { ...n, label } : n));

  const handleDragStart = (e, node) => {
    e.stopPropagation();
    setDraggedNode(node);
    e.dataTransfer.setData('nodeId', node.id);
    e.dataTransfer.setData('nodeType', node.type);
  };

  const handlePoolDragStart = (e, emp) => {
    e.stopPropagation();
    const empData = JSON.stringify(emp);
    e.dataTransfer.setData('empData', empData);
    e.dataTransfer.setData('nodeType', 'pool-emp');
    setDraggedNode({ ...emp, type: 'pool-emp' });
  };

  const handleDrop = (e, targetParentId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const nodeType = e.dataTransfer.getData('nodeType');
    const targetOrg = chartNodes.find(n => n.id === targetParentId);
    
    if (!targetOrg || targetOrg.type !== 'org') return;

    if (nodeType === 'pool-emp') {
      const empData = JSON.parse(e.dataTransfer.getData('empData'));
      const leaderRole = Object.keys(LEADER_TYPES).find(key => empData.position.includes(LEADER_TYPES[key].label));
      
      const newNode = {
        id: `person-${Date.now()}-${empData.id}`,
        type: 'person',
        label: empData.name,
        originalPosition: empData.position,
        role: leaderRole || null,
        parentId: targetParentId,
        level: -1
      };
      setChartNodes(prev => [...prev, newNode]);
    } 
    else {
      const draggedId = e.dataTransfer.getData('nodeId');
      if (draggedId === targetParentId) return;

      setChartNodes(prev => {
        if (nodeType === 'org') {
          const isDescendant = (p, cId) => {
            const kids = prev.filter(n => n.parentId === p);
            if (kids.some(c => c.id === cId)) return true;
            return kids.some(c => isDescendant(c.id, cId));
          };
          if (isDescendant(draggedId, targetParentId)) return prev;
        }
        return prev.map(n => n.id === draggedId ? { ...n, parentId: targetParentId } : n);
      });
    }
    setDraggedNode(null);
  };

  const renderNode = (node) => {
    if (!node) return null;
    const children = chartNodes.filter(n => n.parentId === node.id);
    const sideOrgs = children.filter(n => n.type === 'org' && n.layout === 'side');
    const standardOrgs = children.filter(n => n.type === 'org' && n.layout === 'standard');
    const persons = children.filter(n => n.type === 'person');

    const levelInfo = node.isException ? { name: 'EXC', color: '#94a3b8' } : (levels[node.level - 1] || { name: 'TOP', color: '#0f172a' });

    return (
      <div key={node.id} className="flex flex-col items-center">
        <div className="flex items-start">
          <div className="flex flex-col items-center">
            <div 
              draggable={!node.id.startsWith('root-president')}
              onDragStart={(e) => handleDragStart(e, node)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, node.id)}
              className={`
                relative group flex flex-col min-w-[160px] max-w-[320px] rounded border shadow-sm transition-all bg-white
                ${draggedNode?.id === node.id ? 'opacity-30' : 'opacity-100'}
                ${node.isException ? 'border-dashed border-slate-300 bg-slate-50' : 'border-slate-200'}
                hover:border-blue-500 font-['Noto_Sans_KR'] z-10
              `}
              style={!node.isException ? { borderTopWidth: '4px', borderTopColor: levelInfo.color } : {}}
            >
              <div className="px-2 py-1.5 flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: levelInfo.color }}>
                    {node.isException ? 'Exception' : levelInfo.name}
                  </div>
                  <input 
                    className="w-full font-bold text-xs text-slate-900 bg-transparent outline-none"
                    value={node.label}
                    onChange={(e) => updateLabel(node.id, e.target.value)}
                  />
                </div>
                {!node.id.startsWith('root-') && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} 
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {persons.length > 0 && (
                <div className="p-1 grid grid-cols-2 gap-1 bg-slate-50 border-t border-slate-100">
                  {persons.map(p => {
                    const leader = p.role ? LEADER_TYPES[p.role] : null;
                    return (
                      <div 
                        key={p.id} draggable
                        onDragStart={(e) => handleDragStart(e, p)}
                        onDragEnd={() => setDraggedNode(null)}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded-sm text-[9px] cursor-grab active:cursor-grabbing hover:border-blue-400 group/p"
                      >
                        {leader && <div className={`w-1.5 h-1.5 rounded-full ${leader.color}`} />}
                        <span className="font-medium text-slate-700 truncate">{p.label}</span>
                        <button onClick={(e) => { e.stopPropagation(); deleteNode(p.id); }} className="hidden group-hover/p:block ml-auto text-slate-300 hover:text-red-500">
                          <Trash2 size={8} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="px-2 py-1 flex items-center justify-between bg-slate-50/20 text-[9px] border-t border-slate-50">
                <span className="text-slate-400 font-bold tracking-tighter">Total {persons.length}</span>
                <div className="flex gap-0.5 relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === node.id ? null : node.id);
                    }}
                    className="p-1 text-slate-500 hover:bg-slate-200 rounded transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                  
                  {activeMenu === node.id && (
                    <div 
                      className="absolute bottom-full right-0 mb-2 w-32 bg-white shadow-xl border border-slate-200 rounded-lg p-1 z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[8px] font-bold text-slate-400 px-2 py-1 border-b mb-1 uppercase tracking-tight">Add Unit</p>
                      {levels.map((lvl, idx) => (
                        <button 
                          key={lvl.id} 
                          onClick={() => addNode(node.id, 'org', false, 'standard', idx)} 
                          className="text-left px-2 py-1.5 hover:bg-slate-50 rounded text-slate-700 font-medium transition-colors flex items-center justify-between text-[10px]"
                        >
                          {lvl.name} <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: lvl.color}}></div>
                        </button>
                      ))}
                      <div className="h-px bg-slate-100 my-1"></div>
                      <button onClick={() => addNode(node.id, 'org', false, 'side', 2)} className="text-left px-2 py-1.5 hover:bg-emerald-50 text-emerald-600 rounded font-medium flex items-center justify-between text-[10px]">
                        직속 가로 조직 <ArrowRight size={10} />
                      </button>
                      <button onClick={() => addNode(node.id, 'org', true, 'side')} className="text-left px-2 py-1.5 hover:bg-slate-100 text-slate-400 rounded font-medium flex items-center justify-between text-[10px]">
                        가로 예외 조직 <AlertCircle size={10} />
                      </button>
                    </div>
                  )}

                  {selectedIds.size > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); addSelectedToOrg(node.id); }} 
                      className="p-1 text-indigo-500 hover:bg-indigo-50 rounded" 
                      title="선택된 인원 추가"
                    >
                      <UserPlus size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {sideOrgs.length > 0 && (
            <div className="flex items-start mt-8">
              <div className="w-8 h-px bg-slate-300 mt-4"></div>
              <div className="flex flex-col gap-3 p-2 bg-slate-100/20 rounded border border-dashed border-slate-200 ml-0.5 shadow-inner">
                <span className="text-[7px] font-black text-slate-400 px-1 uppercase tracking-widest">Direct</span>
                {sideOrgs.map(side => (
                  <div key={side.id} className="flex flex-col items-center">
                    {renderNode(side)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {standardOrgs.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="w-px h-8 bg-slate-300"></div>
            <div className="flex items-start gap-12 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-slate-300">
              {standardOrgs.map(child => (
                <div key={child.id} className="relative pt-8 flex flex-col items-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-300"></div>
                  {renderNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const totalStats = useMemo(() => {
    return {
      div: chartNodes.filter(n => n.level === 2 && !n.isException).length,
      group: chartNodes.filter(n => n.level === 3 && !n.isException).length,
      team: chartNodes.filter(n => n.level === 4 && !n.isException).length,
      person: chartNodes.filter(n => n.type === 'person').length
    };
  }, [chartNodes]);

  return (
    <div className="flex h-screen bg-[#f1f5f9] text-slate-900 font-['Noto_Sans_KR'] overflow-hidden" onClick={() => setActiveMenu(null)}>
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shadow-md">
          <h1 className="text-sm font-bold flex items-center gap-2">
            <LayoutDashboard size={16} /> Org Maker Pro
          </h1>
          <button onClick={fetchData} className="hover:rotate-180 transition-transform duration-500"><RefreshCw size={14} /></button>
        </div>

        <div className="flex border-b text-xs font-bold">
          <button onClick={() => setSidebarTab('pool')} className={`flex-1 py-3 transition-colors ${sidebarTab === 'pool' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}>인원 풀</button>
          <button onClick={() => setSidebarTab('config')} className={`flex-1 py-3 transition-colors ${sidebarTab === 'config' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}>설정</button>
        </div>

        {sidebarTab === 'pool' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 space-y-2 bg-slate-50/50">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input placeholder="이름, 부서 검색..." className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded text-xs outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-1">
                <button onClick={selectAllFiltered} className="flex-1 py-1.5 text-[10px] bg-white border border-slate-200 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold">전체 선택</button>
                <button onClick={deselectAll} className="flex-1 py-1.5 text-[10px] bg-white border border-slate-200 rounded hover:bg-red-50 hover:text-red-600 transition-colors font-bold">취소</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
              {filteredPool.map(emp => (
                <div 
                  key={emp.id} 
                  draggable
                  onDragStart={(e) => handlePoolDragStart(e, emp)}
                  onDragEnd={() => setDraggedNode(null)}
                  onClick={() => toggleSelect(emp.id)} 
                  className={`p-2 rounded border text-xs cursor-grab transition-all active:cursor-grabbing ${selectedIds.has(emp.id) ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold pointer-events-none">{emp.name}</span>
                    <span className="text-[9px] text-slate-400 bg-slate-50 px-1 rounded border border-slate-100 pointer-events-none">{emp.position}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1 truncate pointer-events-none">{emp.division} &gt; {emp.team}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Level Settings</h3>
            {levels.map((lvl, idx) => (
              <div key={lvl.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <input type="color" className="w-5 h-5 p-0 border border-slate-200 cursor-pointer rounded overflow-hidden" value={lvl.color} onChange={e => {
                    const n = [...levels]; n[idx].color = e.target.value; setLevels(n);
                  }} />
                  <input className="text-xs font-bold bg-transparent outline-none focus:border-b border-blue-400 transition-all flex-1" value={lvl.name} onChange={e => {
                     const n = [...levels]; n[idx].name = e.target.value; setLevels(n);
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex gap-8 text-[11px] font-bold">
            <div className="flex flex-col"><span className="text-slate-400 text-[9px] font-black uppercase tracking-tight">Division</span><span className="text-slate-900">{totalStats.div}</span></div>
            <div className="flex flex-col border-l border-slate-100 pl-6"><span className="text-slate-400 text-[9px] font-black uppercase tracking-tight">Group</span><span className="text-slate-900">{totalStats.group}</span></div>
            <div className="flex flex-col border-l border-slate-100 pl-6"><span className="text-slate-400 text-[9px] font-black uppercase tracking-tight">Team</span><span className="text-slate-900">{totalStats.team}</span></div>
            <div className="flex flex-col border-l border-slate-100 pl-6"><span className="text-slate-400 text-[9px] font-black uppercase tracking-tight">Headcount</span><span className="text-blue-600 text-lg font-black leading-none">{totalStats.person}</span></div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-white border border-slate-200 px-3 py-2 rounded-full shadow-sm">
                <GripHorizontal size={14} className="text-blue-400" /> 인원 및 조직을 자유롭게 드래그하여 시뮬레이션 하세요.
             </div>
             <button onClick={() => setChartNodes(INITIAL_NODES)} className="text-[10px] font-bold px-4 py-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-500 transition-colors shadow-sm">초기화</button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] p-24">
          <div className="min-w-max flex justify-center items-start">
            {chartNodes.length > 0 && renderNode(chartNodes[0])}
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300 z-50">
            <div className="flex flex-col">
              <span className="text-sm font-black">{selectedIds.size}명의 인원이 대기 중입니다.</span>
              <span className="text-[10px] opacity-70">조직 슬롯의 [+] 메뉴에서 인원을 추가하거나 직접 드래그하세요.</span>
            </div>
            <button onClick={deselectAll} className="p-2 hover:bg-blue-500 rounded-lg transition-colors" title="선택 취소"><XCircle size={20}/></button>
          </div>
        )}
      </main>
    </div>
  );
}