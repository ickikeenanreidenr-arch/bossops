
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Target, Member, TargetType, WorkspaceType } from '../types';
import { 
  Target as TargetIcon, 
  CheckCircle2, 
  Users, 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Plus, 
  X,
  Zap,
  Clock,
  AlertTriangle,
  BadgeAlert,
  Copy,
  Camera,
  Trash2,
  ImageIcon,
  Maximize2,
  User as UserIcon,
  Globe,
  UserCheck,
  Flag,
  Tag,
  Briefcase,
  Calendar as CalendarIcon
} from 'lucide-react';

interface TargetManagerProps {
  targets: Target[];
  setTargets: React.Dispatch<React.SetStateAction<Target[]>>;
  members: Member[];
  workspace: WorkspaceType;
  triggerCreditEvent: (userId: string, eventType: string, data?: any) => void;
}

type Grain = 'week' | 'month';

// 通用 iOS 风格下拉组件
interface CustomSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string; icon?: React.ReactNode; avatar?: string; subLabel?: string }[];
  onChange: (value: any) => void;
  icon?: React.ReactNode;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
        {icon} {label}
      </label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm group ${isOpen ? 'ring-4 ring-blue-50 bg-white' : 'hover:bg-slate-100/50'}`}
      >
        <div className="flex items-center gap-3">
          {selectedOption?.avatar && <img src={selectedOption.avatar} className="w-6 h-6 rounded-lg object-cover" />}
          {selectedOption?.icon && <span className="text-blue-500">{selectedOption.icon}</span>}
          <span>{selectedOption?.label}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[210]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-3xl shadow-2xl z-[220] p-2 animate-in zoom-in-95 fade-in duration-200 border-white border-2 overflow-hidden">
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${value === opt.value ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  {opt.avatar && <img src={opt.avatar} className="w-8 h-8 rounded-lg object-cover border border-white/20" />}
                  {opt.icon && <span className={value === opt.value ? 'text-white' : 'text-blue-500'}>{opt.icon}</span>}
                  <div className="text-left">
                    <p className="text-xs font-black">{opt.label}</p>
                    {opt.subLabel && <p className={`text-[9px] font-bold uppercase ${value === opt.value ? 'text-white/50' : 'text-slate-400'}`}>{opt.subLabel}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// iOS 风格日期选择组件
interface CustomDatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  icon?: React.ReactNode;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ label, value, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(value || Date.now()));
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const onSelectDate = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(selected.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const renderDays = () => {
    const totalDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDay = firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
    const days = [];
    
    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // 填充日期
    for (let day = 1; day <= totalDays; day++) {
      const isSelected = value === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().split('T')[0];
      const isToday = new Date().toISOString().split('T')[0] === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().split('T')[0];
      
      days.push(
        <button
          key={day}
          onClick={() => onSelectDate(day)}
          className={`h-10 w-10 rounded-xl text-xs font-black transition-all flex items-center justify-center num-font ${isSelected ? 'bg-blue-600 text-white shadow-lg' : isToday ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600'}`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
        {icon} {label}
      </label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm group ${isOpen ? 'ring-4 ring-blue-50 bg-white shadow-inner' : 'hover:bg-slate-100/50'}`}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon size={16} className="text-blue-500" />
          <span className="num-font">{value}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[210]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-[2rem] shadow-2xl z-[220] p-5 animate-in zoom-in-95 fade-in duration-200 border-white border-2 min-w-[320px]">
            <div className="flex justify-between items-center mb-4">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400"><ChevronLeft size={18}/></button>
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月
              </h5>
              <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400"><ChevronRight size={18}/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} className="h-8 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderDays()}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  onSelectDate(tomorrow.getDate());
                }}
                className="py-2 bg-slate-50 text-[10px] font-black text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
              >
                明天截止
              </button>
              <button 
                onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  onSelectDate(nextWeek.getDate());
                }}
                className="py-2 bg-slate-50 text-[10px] font-black text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
              >
                一周后截止
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const TargetManager: React.FC<TargetManagerProps> = ({ targets, setTargets, members, workspace, triggerCreditEvent }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null); 
  const [completionNote, setCompletionNote] = useState('');
  const [completionImages, setCompletionImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null); 
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [isPerspectiveOpen, setIsPerspectiveOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [timeOffset, setTimeOffset] = useState(0);
  const [timeGrain, setTimeGrain] = useState<Grain>('week');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tmallOptions: TargetType[] = ['爆款百万链接', '低价秒杀链接', '顺手链接', '分裂链接', '其他链接'];
  const taoOptions: TargetType[] = ['日销200+链接', '日销500+链接', '日销1000+链接', '其他链接'];
  
  const currentOptions = (workspace === 'Tmall' ? tmallOptions : taoOptions).map(opt => ({ value: opt, label: opt, icon: <Tag size={14}/> }));

  const priorityOptions = [
    { value: 'High', label: '极高 (紧急突破)', icon: <Zap size={14} className="text-red-500" /> },
    { value: 'Medium', label: '常规 (稳步推进)', icon: <Flag size={14} className="text-orange-500" /> },
    { value: 'Low', label: '低位 (长效积累)', icon: <Clock size={14} className="text-slate-400" /> }
  ];

  const operatorOptions = members.map(m => ({
    value: m.id,
    label: m.name,
    avatar: m.avatar,
    subLabel: m.role
  }));

  const [newTarget, setNewTarget] = useState<Partial<Target>>({
    title: '',
    type: workspace === 'Tmall' ? '爆款百万链接' : '日销200+链接',
    priority: 'Medium',
    operatorId: members[0]?.id || '',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const activeRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timeGrain === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() + (timeOffset * 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    } else {
      const start = new Date(today.getFullYear(), today.getMonth() + timeOffset, 1);
      const end = new Date(today.getFullYear(), today.getMonth() + timeOffset + 1, 0);
      return { start, end };
    }
  }, [timeGrain, timeOffset]);

  useEffect(() => {
    const now = new Date();
    const currentWeekKey = `W${activeRange.start.getFullYear()}-${Math.ceil((activeRange.start.getDate() + 6) / 7)}`;

    members.forEach(member => {
      const weeklyTargets = targets.filter(t => 
        t.operatorId === member.id && 
        new Date(t.deadline) >= activeRange.start && 
        new Date(t.deadline) <= activeRange.end
      );
      
      if (weeklyTargets.length < 5 && timeGrain === 'week' && timeOffset === 0) {
        triggerCreditEvent(member.id, 'WEEKLY_GOAL_COUNT_INSUFFICIENT', { 
          count: weeklyTargets.length,
          cycleKey: currentWeekKey 
        });
      }

      targets.forEach(target => {
        if (target.operatorId === member.id && !target.completedAt) {
          const deadline = new Date(target.deadline);
          if (now > deadline) {
            const diffDays = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
            const cycleId = Math.floor(diffDays / 3);
            if (cycleId >= 0) {
              triggerCreditEvent(member.id, 'GOAL_OVERDUE_PENALTY', {
                relatedId: target.id,
                cycleKey: `cycle-${cycleId}`
              });
            }
          }
        }
      });
    });
  }, [targets, members, activeRange, timeGrain, timeOffset, triggerCreditEvent]);

  const filteredTargets = useMemo(() => {
    return targets.filter(t => {
      const memberMatch = selectedMemberId === 'all' || t.operatorId === selectedMemberId;
      const searchMatch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const targetDate = new Date(t.deadline);
      const cycleMatch = targetDate >= activeRange.start && targetDate <= activeRange.end;
      return memberMatch && searchMatch && cycleMatch;
    });
  }, [targets, selectedMemberId, activeRange, searchQuery]);

  const handleAddTarget = () => {
    if (!newTarget.title) {
      alert('请填写目标内容');
      return;
    }
    const target: Target = {
      ...newTarget as Target,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTargets([...targets, target]);
    setShowAddModal(false);
    setNewTarget({
      title: '',
      type: workspace === 'Tmall' ? '爆款百万链接' : '日销200+链接',
      priority: 'Medium',
      operatorId: members[0]?.id || '',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target?.result as string;
      setCompletionImages(prev => [...prev, base64Image]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const removeCompletionImage = (index: number) => {
    setCompletionImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompleteSubmit = () => {
    if (!completionNote.trim()) {
      alert('请填写目标达成的心得或复盘记录！');
      return;
    }
    if (!showCompleteModal) return;

    const target = targets.find(t => t.id === showCompleteModal);
    if (target) {
      const now = new Date();
      const deadline = new Date(target.deadline);
      deadline.setHours(23, 59, 59, 999);
      const isLate = now > deadline;
      triggerCreditEvent(target.operatorId, isLate ? 'GOAL_COMPLETE_LATE' : 'GOAL_COMPLETE_ON_TIME', { 
        relatedId: target.id,
        cycleKey: 'completion'
      });
    }

    setTargets(targets.map(t => 
      t.id === showCompleteModal 
        ? { 
            ...t, 
            completedAt: new Date().toISOString(), 
            completionNote: completionNote,
            completionImages: completionImages
          } 
        : t
    ));
    setShowCompleteModal(null);
    setCompletionNote('');
    setCompletionImages([]);
  };

  const getTargetStatus = (target: Target) => {
    const now = new Date();
    const deadlineStr = target.deadline; 
    const deadlineEndOfDay = new Date(deadlineStr);
    deadlineEndOfDay.setHours(23, 59, 59, 999);
    
    if (target.completedAt) {
      const completedAt = new Date(target.completedAt);
      if (completedAt > deadlineEndOfDay) {
        return { label: '已逾期完成', color: 'bg-orange-100 text-orange-600 border-orange-200', icon: AlertTriangle };
      }
      return { label: '按期达成', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: CheckCircle2 };
    }
    
    if (now > deadlineEndOfDay) {
      return { label: '已逾期', color: 'bg-red-100 text-red-600 border-red-200 animate-pulse', icon: BadgeAlert };
    }
    return { label: '完成中', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: Clock };
  };

  const getTypeBadgeColor = (type: TargetType) => {
    switch (type) {
      case '爆款百万链接':
      case '日销1000+链接': return 'bg-rose-50 text-rose-600 border-rose-100';
      case '低价秒杀链接':
      case '日销500+链接': return 'bg-orange-50 text-orange-600 border-orange-100';
      case '顺手链接':
      case '日销200+链接': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const detailTarget = useMemo(() => targets.find(t => t.id === detailTargetId), [targets, detailTargetId]);
  const detailOperator = useMemo(() => members.find(m => m.id === detailTarget?.operatorId), [members, detailTarget]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
         <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">致富目标管理 ({workspace === 'Tmall' ? '天猫' : '淘工厂'})</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              规划核心增长路径，锁定爆款收益指标。每周 ≥5 个目标，维护团队信用基石。
            </p>
         </div>
         <button 
           onClick={() => setShowAddModal(true)}
           className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-blue-600 active:scale-95 transition-all text-sm"
         >
            <Plus size={18} /> 设定新致富目标
         </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <Search className="text-slate-300 ml-2" size={20} />
           <input 
             type="text" 
             placeholder="搜索目标内容..." 
             className="flex-1 border-none outline-none font-bold text-slate-600 text-sm"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsPerspectiveOpen(!isPerspectiveOpen)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-sm transition-all font-black text-xs ios-btn border bg-white min-w-[200px] ${isPerspectiveOpen ? 'border-slate-900 shadow-xl scale-[1.02]' : 'border-slate-100 hover:shadow-lg'}`}
          >
            {selectedMemberId === 'all' ? <Globe size={18} className="text-blue-500" /> : <UserCheck size={18} className="text-emerald-500" />}
            <span className="text-slate-600 flex-1 text-left">{selectedMemberId === 'all' ? '全员目标' : selectedMember?.name}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isPerspectiveOpen ? 'rotate-180 opacity-50' : 'text-slate-300'}`} />
          </button>

          {isPerspectiveOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPerspectiveOpen(false)}></div>
              <div className="absolute top-full right-0 mt-3 w-64 glass-panel rounded-[2rem] shadow-2xl z-50 p-3 animate-in zoom-in-95 fade-in duration-200 origin-top-right border-white border-2">
                 <button 
                   onClick={() => { setSelectedMemberId('all'); setIsPerspectiveOpen(false); }}
                   className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${selectedMemberId === 'all' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                 >
                    <Globe size={14} />
                    <span className="text-xs font-black">全员视角 (Team View)</span>
                 </button>
                 <div className="h-px bg-slate-100 my-2 mx-4"></div>
                 <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                   {members.map(m => (
                     <button 
                       key={m.id}
                       onClick={() => { setSelectedMemberId(m.id); setIsPerspectiveOpen(false); }}
                       className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedMemberId === m.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                     >
                        <img src={m.avatar} className="w-8 h-8 rounded-lg object-cover border border-white/50" alt="" />
                        <div className="text-left">
                          <p className="text-xs font-black">{m.name}</p>
                          <p className={`text-[9px] font-bold uppercase ${selectedMemberId === m.id ? 'text-blue-100' : 'text-slate-400'}`}>{m.role}</p>
                        </div>
                     </button>
                   ))}
                 </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
         <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
            <button 
              onClick={() => { setTimeGrain('week'); setTimeOffset(0); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${timeGrain === 'week' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              本周视角
            </button>
            <button 
              onClick={() => { setTimeGrain('month'); setTimeOffset(0); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${timeGrain === 'month' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              本月视角
            </button>
         </div>

         <div className="flex items-center gap-4">
            <button onClick={() => setTimeOffset(timeOffset - 1)} className="p-2 bg-white rounded-full border border-slate-100 shadow-sm hover:shadow-md transition-all"><ChevronLeft size={18}/></button>
            <div className="text-center min-w-[120px]">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{timeGrain === 'week' ? 'Weekly Timeline' : 'Monthly Timeline'}</p>
               <p className="text-sm font-black text-slate-800">
                  {timeGrain === 'week' ? `${activeRange.start.toLocaleDateString()} - ${activeRange.end.toLocaleDateString()}` : `${activeRange.start.getFullYear()}年${activeRange.start.getMonth() + 1}月`}
               </p>
            </div>
            <button onClick={() => setTimeOffset(timeOffset + 1)} className="p-2 bg-white rounded-full border border-slate-100 shadow-sm hover:shadow-md transition-all"><ChevronRight size={18}/></button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredTargets.map(target => {
            const status = getTargetStatus(target);
            const operator = members.find(m => m.id === target.operatorId);

            return (
               <div key={target.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all p-8 flex flex-col group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-tighter shadow-sm ${status.color}`}>
                     {status.label}
                  </div>

                  <div className="flex justify-between items-start mb-6 pt-2">
                     <span className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${getTypeBadgeColor(target.type)}`}>
                        {target.type}
                     </span>
                     <div className={`w-2 h-2 rounded-full ${target.priority === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : target.priority === 'Medium' ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                  </div>

                  <h3 className="text-lg font-black text-slate-800 mb-6 leading-tight flex-1">{target.title}</h3>

                  <div className="space-y-4 pt-6 border-t border-slate-50">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <img src={operator?.avatar} className="w-6 h-6 rounded-lg object-cover border border-white shadow-sm" alt=""/>
                           <span className="text-xs font-black text-slate-600">{operator?.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] num-font uppercase">
                           <Clock size={12} />
                           {new Date(target.deadline).toLocaleDateString()}
                        </div>
                     </div>

                     {!target.completedAt ? (
                        <button 
                          onClick={() => setShowCompleteModal(target.id)}
                          className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl text-xs font-black hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 group/btn"
                        >
                           <CheckCircle2 size={16} className="group-hover/btn:scale-110 transition-transform"/>
                           确认达成目标
                        </button>
                     ) : (
                        <div 
                          onClick={() => setDetailTargetId(target.id)}
                          className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-100/50 hover:shadow-md transition-all group/review relative"
                        >
                           <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-emerald-600">
                                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                   <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                                   <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                                 </svg>
                                 <span className="text-[10px] font-black uppercase tracking-widest">达成复盘心得</span>
                              </div>
                              <Maximize2 size={12} className="text-emerald-400 opacity-0 group-hover/review:opacity-100 transition-opacity" />
                           </div>
                           <p className="text-[11px] text-emerald-800 font-medium leading-relaxed italic line-clamp-2">“{target.completionNote}”</p>
                           {target.completionImages && target.completionImages.length > 0 && (
                             <div className="mt-3 flex flex-wrap gap-1.5">
                               {target.completionImages.slice(0, 3).map((img, idx) => (
                                 <div key={idx} className="w-8 h-8 rounded-md overflow-hidden border border-white shadow-sm">
                                   <img src={img} className="w-full h-full object-cover" alt="" />
                                 </div>
                               ))}
                               {target.completionImages.length > 3 && (
                                 <div className="w-8 h-8 rounded-md bg-emerald-200 flex items-center justify-center text-[10px] font-black text-emerald-600">
                                   +{target.completionImages.length - 3}
                                 </div>
                               )}
                             </div>
                           )}
                           <p className="text-[9px] text-emerald-400 font-bold mt-2 text-right num-font italic">点击查阅详情报告</p>
                        </div>
                     )}
                  </div>
               </div>
            );
         })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 animate-in fade-in zoom-in duration-300 shadow-2xl relative overflow-visible">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-3xl font-black text-slate-800 tracking-tighter">设定全新致富航向</h2>
                 <button onClick={() => setShowAddModal(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={24}/></button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">具体致富目标内容</label>
                    <textarea 
                      className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" 
                      placeholder="例如：打造一款日销 500+ 的百万级爆款单品"
                      rows={3}
                      value={newTarget.title}
                      onChange={(e) => setNewTarget({...newTarget, title: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <CustomSelect 
                      label="目标性质分类"
                      value={newTarget.type!}
                      options={currentOptions}
                      onChange={(val) => setNewTarget({...newTarget, type: val})}
                      icon={<Tag size={12} className="text-blue-500"/>}
                    />
                    <CustomSelect 
                      label="优先级定义"
                      value={newTarget.priority!}
                      options={priorityOptions}
                      onChange={(val) => setNewTarget({...newTarget, priority: val})}
                      icon={<Zap size={12} className="text-red-500"/>}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <CustomSelect 
                      label="指派负责人"
                      value={newTarget.operatorId!}
                      options={operatorOptions}
                      onChange={(val) => setNewTarget({...newTarget, operatorId: val})}
                      icon={<Briefcase size={12} className="text-indigo-500"/>}
                    />
                    <CustomDatePicker 
                      label="目标截止日期"
                      value={newTarget.deadline!}
                      onChange={(val) => setNewTarget({...newTarget, deadline: val})}
                      icon={<Clock size={12} className="text-blue-500"/>}
                    />
                 </div>

                 <button onClick={handleAddTarget} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-blue-600 active:scale-95 transition-all mt-4">立即发布实操目标</button>
              </div>
           </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[210] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 animate-in fade-in zoom-in duration-300 shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-4">目标达成！复盘总结</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">分享该目标的实操经验与心得</p>
            <textarea 
               className="w-full p-6 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-700 mb-6" 
               placeholder="在此处输入复盘内容..."
               rows={4}
               value={completionNote}
               onChange={(e) => setCompletionNote(e.target.value)}
            />
            <div className="space-y-3 mb-8">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <ImageIcon size={12} className="text-emerald-500" /> 达成证明/数据截图 (可选)
               </label>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
               <div className="flex flex-wrap gap-3">
                  {completionImages.map((img, idx) => (
                    <div key={idx} className="relative group w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                       <img src={img} className="w-full h-full object-cover" alt="" />
                       <button onClick={() => removeCompletionImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-emerald-400 hover:text-emerald-500 transition-all"><Camera size={20} /><span className="text-[8px] font-black mt-1 uppercase">上传</span></button>
               </div>
            </div>
            <div className="flex gap-4">
               <button onClick={() => { setShowCompleteModal(null); setCompletionImages([]); }} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">取消</button>
               <button onClick={handleCompleteSubmit} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 shadow-xl shadow-emerald-900/10 active:scale-95 transition-all">确认并保存心得</button>
            </div>
          </div>
        </div>
      )}

      {detailTargetId && detailTarget && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[250] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-5xl max-h-full rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
              <div className="p-8 md:p-12 flex justify-between items-start border-b border-slate-50 bg-slate-50/50">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getTypeBadgeColor(detailTarget.type)}`}>{detailTarget.type}</span>
                       <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">目标已达成</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter max-w-2xl leading-tight">{detailTarget.title}</h2>
                    <div className="flex items-center gap-6 text-slate-400">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 p-0.5 shadow-sm"><img src={detailOperator?.avatar} className="w-full h-full rounded-full object-cover" alt="" /></div>
                          <span className="text-sm font-black text-slate-600">{detailOperator?.name} <span className="text-slate-300 font-bold ml-1">{detailOperator?.role}</span></span>
                       </div>
                       <div className="h-4 w-px bg-slate-200"></div>
                       <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest num-font"><Clock size={14} className="text-emerald-500" />达成时间: {new Date(detailTarget.completedAt!).toLocaleDateString()}</div>
                    </div>
                 </div>
                 <button onClick={() => setDetailTargetId(null)} className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl shadow-xl hover:text-red-500 transition-all ios-btn hover:rotate-90"><X size={28} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar">
                 <section className="relative">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute -top-6 -left-8 text-slate-100 opacity-80">
                      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                    </svg>
                    <div className="relative z-10 space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><span className="w-8 h-px bg-slate-200"></span> 实操心得与复盘记录</h4>
                       <p className="text-xl md:text-2xl font-bold text-slate-700 leading-relaxed italic pl-4 border-l-4 border-emerald-500/30">{detailTarget.completionNote}</p>
                    </div>
                 </section>
                 {detailTarget.completionImages && detailTarget.completionImages.length > 0 && (
                   <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><span className="w-8 h-px bg-slate-200"></span> 数字化达成证明截图</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                         {detailTarget.completionImages.map((img, idx) => (
                           <div key={idx} className="group relative aspect-[4/3] rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-zoom-in bg-slate-50 border border-slate-100" onClick={() => setPreviewImage(img)}>
                              <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center"><Maximize2 className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all" size={32} /></div>
                           </div>
                         ))}
                      </div>
                   </section>
                 )}
              </div>
              <div className="p-8 md:px-12 py-8 bg-slate-50 flex justify-end">
                 <button onClick={() => setDetailTargetId(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-600 transition-all">完成阅读</button>
              </div>
           </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 bg-slate-900/98 z-[300] flex items-center justify-center p-10 cursor-zoom-out animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
           <img src={previewImage} className="max-w-full max-h-full rounded-2xl shadow-2xl border-4 border-white/10" alt="Preview" />
           <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors bg-white/10 p-4 rounded-full backdrop-blur-md"><X size={40} /></button>
        </div>
      )}
    </div>
  );
};

export default TargetManager;
