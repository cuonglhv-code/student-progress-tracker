import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  CheckCircle2, 
  BookOpen, 
  GraduationCap, 
  Plus, 
  Search,
  Calendar,
  ChevronRight,
  TrendingUp,
  Award,
  Filter,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { api } from './api';
import { Student, Attendance, Homework, AppData, User as UserType, Class, Test, TestResult, HomeworkSubmission } from './types';

// --- Components ---

const Badge = ({ children, variant = 'neutral', className = "" }: { children: React.ReactNode, variant?: 'success' | 'warning' | 'danger' | 'neutral', className?: string }) => {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-rose-50 text-rose-700 border-rose-100",
    neutral: "bg-slate-50 text-slate-700 border-slate-100"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "" }: { children: React.ReactNode, onClick?: () => void, variant?: 'primary' | 'secondary' | 'outline', className?: string }) => {
  const base = "px-4 py-2 rounded-xl font-medium transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-200 text-slate-600 hover:bg-slate-50"
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5 flex-1">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    <input 
      {...props} 
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
    />
  </div>
);

const Select = ({ label, options, ...props }: { label: string, options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="space-y-1.5 flex-1">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    <select 
      {...props} 
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm appearance-none"
    >
      <option value="">All {label}s</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'classes' | 'homework' | 'attendance' | 'tests' | 'settings'>('dashboard');
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddHomework, setShowAddHomework] = useState(false);
  const [showAddTest, setShowAddTest] = useState(false);
  const [markingHomework, setMarkingHomework] = useState<{ hwId: string, studentId: string } | null>(null);
  const [markingTest, setMarkingTest] = useState<{ testId: string, studentId: string } | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({ 
    studentId: '', 
    classId: '', 
    teacherId: '', 
    startDate: '', 
    endDate: '' 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (email?: string) => {
    try {
      const res = await api.getData(email);
      setData(res);
      if (res.currentUser) {
        localStorage.setItem('currentUserEmail', res.currentUser.email);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentUser = data?.currentUser;
  const isAdmin = currentUser?.role === 'Admin';
  const isTeacher = currentUser?.role === 'Teacher';
  const isTA = currentUser?.role === 'TA';

  // Derived Data & Filtering
  const filteredData = useMemo(() => {
    if (!data) return null;

    let students = data.students || [];
    let classes = data.classes || [];

    // Role-based scoping
    if (!isAdmin) {
      const assignedIds = currentUser?.assignedClassIds || [];
      students = students.filter(s => assignedIds.includes(s.classId));
      classes = classes.filter(c => assignedIds.includes(c.id));
    }

    // UI Filters
    students = students.filter(s => {
      const matchClass = !filters.classId || s.classId === filters.classId;
      const matchTeacher = !filters.teacherId || s.teacherId === filters.teacherId;
      const matchStudent = !filters.studentId || s.id === filters.studentId;
      return matchClass && matchTeacher && matchStudent;
    });

    const studentIds = new Set(students.map(s => s.id));
    const classIds = new Set(classes.map(c => c.id));

    const filterByDate = (item: { date?: string, assignedDate?: string }) => {
      const itemDate = item.date || item.assignedDate;
      if (!itemDate || (!filters.startDate && !filters.endDate)) return true;
      const date = parseISO(itemDate);
      const start = filters.startDate ? parseISO(filters.startDate) : new Date(0);
      const end = filters.endDate ? parseISO(filters.endDate) : new Date();
      return isWithinInterval(date, { start, end });
    };

    return {
      students,
      classes,
      attendance: (data.attendance || []).filter(a => studentIds.has(a.studentId) && filterByDate(a)),
      homework: (data.homework || []).filter(h => classIds.has(h.classId) && filterByDate(h)),
      homeworkSubmissions: (data.homeworkSubmissions || []).filter(hs => studentIds.has(hs.studentId)),
      tests: (data.tests || []).filter(t => classIds.has(t.classId) && filterByDate(t)),
      testResults: (data.testResults || []).filter(tr => studentIds.has(tr.studentId))
    };
  }, [data, filters, currentUser, isAdmin]);

  const stats = useMemo(() => {
    if (!filteredData) return null;
    const { students, attendance, homeworkSubmissions } = filteredData;
    
    const totalStudents = students.length;
    const avgCurrentBand = students.length > 0
      ? (students.reduce((acc, s) => acc + Number(s.currentBand), 0) / students.length).toFixed(1)
      : 0;
    const avgTargetBand = students.length > 0
      ? (students.reduce((acc, s) => acc + Number(s.targetBand), 0) / students.length).toFixed(1)
      : 0;
    const attendanceRate = attendance.length > 0 
      ? (attendance.filter(a => a.status === 'Present').length / attendance.length * 100).toFixed(1)
      : 0;
    const hwRate = homeworkSubmissions.length > 0
      ? (homeworkSubmissions.filter(hs => hs.status === 'Submitted' || hs.status === 'Reviewed').length / homeworkSubmissions.length * 100).toFixed(1)
      : 0;

    return { totalStudents, avgCurrentBand, avgTargetBand, attendanceRate, hwRate };
  }, [filteredData]);

  // Chart Data
  const charts = useMemo(() => {
    if (!filteredData) return null;
    const { students, attendance, testResults } = filteredData;

    // 1. Band Progress Over Time
    const progressData = testResults
      .sort((a, b) => new Date(a.markedDate).getTime() - new Date(b.markedDate).getTime())
      .map(tr => ({
        date: format(parseISO(tr.markedDate), 'MMM d'),
        overall: Number(tr.overall),
        listening: Number(tr.listening),
        reading: Number(tr.reading),
        writing: Number(tr.writing),
        speaking: Number(tr.speaking)
      }));

    // 2. Avg Band by Class
    const classBands: Record<string, { total: number, count: number }> = {};
    students.forEach(s => {
      const cls = (data?.classes || []).find(c => c.id === s.classId)?.name || 'Unknown';
      if (!classBands[cls]) classBands[cls] = { total: 0, count: 0 };
      classBands[cls].total += Number(s.currentBand);
      classBands[cls].count += 1;
    });
    const classData = Object.entries(classBands).map(([name, d]) => ({
      name,
      avg: (d.total / d.count).toFixed(1)
    }));

    // 3. Attendance Distribution
    const attDist = [
      { name: 'Present', value: attendance.filter(a => a.status === 'Present').length, color: '#10b981' },
      { name: 'Absent', value: attendance.filter(a => a.status === 'Absent').length, color: '#ef4444' },
      { name: 'Late', value: attendance.filter(a => a.status === 'Late').length, color: '#f59e0b' },
      { name: 'Excused', value: attendance.filter(a => a.status === 'Excused').length, color: '#6366f1' },
    ].filter(d => d.value > 0);

    // 4. Skills Comparison (Radar)
    const avgSkills = testResults.length > 0 ? [
      { subject: 'Listening', A: testResults.reduce((acc, tr) => acc + Number(tr.listening), 0) / testResults.length },
      { subject: 'Reading', A: testResults.reduce((acc, tr) => acc + Number(tr.reading), 0) / testResults.length },
      { subject: 'Writing', A: testResults.reduce((acc, tr) => acc + Number(tr.writing), 0) / testResults.length },
      { subject: 'Speaking', A: testResults.reduce((acc, tr) => acc + Number(tr.speaking), 0) / testResults.length },
    ] : [];

    return { progressData, classData, attDist, avgSkills };
  }, [filteredData, data]);

  const uniqueClasses = useMemo(() => (data?.classes || []).map(c => ({ id: c.id, name: c.name })), [data]);
  const uniqueTeachers = useMemo(() => (data?.users || []).filter(u => u.role === 'Teacher').map(u => ({ id: u.id, name: u.name })), [data]);

  if (loading || !data || !stats || !charts || !filteredData) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <GraduationCap size={24} />
          </div>
          <h1 className="font-bold text-slate-900 leading-tight">IELTS<br/><span className="text-indigo-600">Tracker</span></h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin', 'Teacher', 'TA'] },
            { id: 'students', icon: Users, label: 'Students', roles: ['Admin', 'Teacher', 'TA'] },
            { id: 'classes', icon: GraduationCap, label: 'Classes', roles: ['Admin', 'Teacher', 'TA'] },
            { id: 'attendance', icon: CheckCircle2, label: 'Attendance', roles: ['Admin', 'Teacher', 'TA'] },
            { id: 'homework', icon: BookOpen, label: 'Homework', roles: ['Admin', 'Teacher'] },
            { id: 'tests', icon: Award, label: 'Tests & Progress', roles: ['Admin', 'Teacher'] },
            { id: 'settings', icon: Settings, label: 'Settings', roles: ['Admin', 'Teacher', 'TA'] },
          ].filter(item => item.roles.includes(currentUser?.role || '')).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="px-4 mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Switch Role (Demo)</p>
          </div>
          <div className="flex flex-col gap-1">
            {data.users.map(u => (
              <button 
                key={u.id}
                onClick={() => loadData(u.email)}
                className={`text-left px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  currentUser?.id === u.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {u.name} ({u.role})
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h2>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar size={16} />
              {format(new Date(), 'EEEE, MMMM do')}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="text-xs h-9">
              <Download size={14} /> Export Report
            </Button>
            {activeTab === 'students' && (
              <Button onClick={() => setShowAddStudent(true)} className="text-xs h-9">
                <Plus size={14} /> New Student
              </Button>
            )}
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Global Filters */}
          <Card className="p-6 bg-white">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
              <Filter size={18} className="text-indigo-600" />
              Advanced Filters
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Select 
                label="Class" 
                options={uniqueClasses.map(c => c.name)} 
                value={uniqueClasses.find(c => c.id === filters.classId)?.name || ''}
                onChange={e => {
                  const c = uniqueClasses.find(cls => cls.name === e.target.value);
                  setFilters({ ...filters, classId: c ? c.id : '' });
                }}
              />
              <Select 
                label="Teacher" 
                options={uniqueTeachers.map(t => t.name)} 
                value={uniqueTeachers.find(t => t.id === filters.teacherId)?.name || ''}
                onChange={e => {
                  const t = uniqueTeachers.find(tch => tch.name === e.target.value);
                  setFilters({ ...filters, teacherId: t ? t.id : '' });
                }}
              />
              <Select 
                label="Student" 
                options={data.students.map(s => s.name)} 
                value={data.students.find(s => s.id === filters.studentId)?.name || ''}
                onChange={e => {
                  const s = data.students.find(st => st.name === e.target.value);
                  setFilters({ ...filters, studentId: s ? s.id : '' });
                }}
              />
              <Input 
                label="From" 
                type="date" 
                value={filters.startDate}
                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              />
              <Input 
                label="To" 
                type="date" 
                value={filters.endDate}
                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </Card>

          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[
                  { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Avg Current Band', value: stats.avgCurrentBand, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Avg Target Band', value: stats.avgTargetBand, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'HW Completion', value: `${stats.hwRate}%`, icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((stat, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={stat.label}
                  >
                    <Card className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                          <stat.icon size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">{stat.label}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Band Progress */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Student Band Progress</h3>
                    <TrendingUp size={20} className="text-indigo-600" />
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={charts.progressData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 9]} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend iconType="circle" />
                        <Line name="Overall" type="monotone" dataKey="overall" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Skills Radar */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Skills Comparison</h3>
                    <Activity size={20} className="text-indigo-600" />
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={charts.avgSkills}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 9]} tick={false} axisLine={false} />
                        <Radar name="Avg Skills" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Class Comparison */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Avg Band by Class</h3>
                    <BarChart3 size={20} className="text-indigo-600" />
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.classData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 9]} />
                        <Tooltip />
                        <Bar dataKey="avg" fill="#818cf8" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Attendance Distribution */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Attendance Distribution</h3>
                    <PieChartIcon size={20} className="text-indigo-600" />
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.attDist}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {charts.attDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.classes.map(cls => (
                <Card key={cls.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-lg">{cls.name}</h3>
                    <Badge variant={cls.status === 'Active' ? 'success' : 'neutral'}>{cls.status}</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-medium">Level:</span>
                      <span>{cls.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Teacher:</span>
                      <span>{data.users.find(u => u.id === cls.teacherId)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Schedule:</span>
                      <span>{cls.schedule}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Students:</span>
                      <span>{data.students.filter(s => s.classId === cls.id).length}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex gap-2">
                    <Button variant="outline" className="flex-1 text-xs py-1.5">View Details</Button>
                    <Button variant="secondary" className="flex-1 text-xs py-1.5">Edit</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {filteredData.classes.map(cls => (
                <Card key={cls.id} className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{cls.name}</h3>
                      <p className="text-xs text-slate-500">Mark attendance for {format(new Date(), 'MMM d, yyyy')}</p>
                    </div>
                    <Button variant="outline" className="text-xs">History</Button>
                  </div>
                  <div className="space-y-3">
                    {filteredData.students.filter(s => s.classId === cls.id).map(student => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-700 text-sm">{student.name}</span>
                        </div>
                        <div className="flex gap-1.5">
                          {['Present', 'Absent', 'Late', 'Excused'].map(status => (
                            <button
                              key={status}
                              onClick={() => api.markAttendance({ 
                                studentId: student.id, 
                                classId: cls.id,
                                date: new Date().toISOString(), 
                                session: "Morning",
                                status: status as any,
                                markedById: currentUser?.id || '',
                                notes: ''
                              }).then(() => loadData())}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold capitalize transition-all ${
                                data.attendance.find(a => a.studentId === student.id && isSameDay(parseISO(a.date), new Date()))?.status === status
                                  ? status === 'Present' ? 'bg-green-600 text-white shadow-lg shadow-green-100' :
                                    status === 'Absent' ? 'bg-red-600 text-white shadow-lg shadow-red-100' :
                                    status === 'Late' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' :
                                    'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                  : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'homework' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Homework Assignments</h3>
                {isAdmin || isTeacher ? (
                  <Button onClick={() => setShowAddHomework(true)}><Plus size={16} /> Assign Homework</Button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredData.homework.map(hw => (
                  <Card key={hw.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{hw.title}</h4>
                        <p className="text-xs text-slate-500">Due: {format(parseISO(hw.dueDate), 'MMM d, yyyy')}</p>
                      </div>
                      <Badge variant={hw.status === 'Assigned' ? 'warning' : 'neutral'}>{hw.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{hw.description}</p>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1"><BookOpen size={14} /> {hw.skillCategory}</span>
                      <span className="flex items-center gap-1"><GraduationCap size={14} /> {data.classes.find(c => c.id === hw.classId)?.name}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Submissions</h5>
                      <div className="space-y-2">
                        {data.students.filter(s => s.classId === hw.classId).map(student => {
                          const sub = data.homeworkSubmissions.find(hs => hs.homeworkId === hw.id && hs.studentId === student.id);
                          return (
                            <div key={student.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700">{student.name}</span>
                              <div className="flex items-center gap-2">
                                {sub ? (
                                  <Badge variant={sub.status === 'Reviewed' ? 'success' : 'warning'}>{sub.status}</Badge>
                                ) : (
                                  <Badge variant="danger">Missing</Badge>
                                )}
                                {(isAdmin || isTeacher) && (
                                  <button 
                                    onClick={() => setMarkingHomework({ hwId: hw.id, studentId: student.id })}
                                    className="text-indigo-600 hover:underline text-xs font-bold"
                                  >
                                    Mark
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Tests & Assessments</h3>
                {isAdmin || isTeacher ? (
                  <Button onClick={() => setShowAddTest(true)}><Plus size={16} /> New Test</Button>
                ) : null}
              </div>
              <div className="space-y-6">
                {filteredData.tests.map(test => (
                  <Card key={test.id} className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{test.title}</h4>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={14} /> {format(parseISO(test.date), 'MMM d, yyyy')}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1"><GraduationCap size={14} /> {data.classes.find(c => c.id === test.classId)?.name}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {test.skillsAssessed.map(skill => (
                          <span key={skill} className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-700 border-slate-100">{skill}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">L</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">R</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">W</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">S</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall</th>
                            <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {data.students.filter(s => s.classId === test.classId).map(student => {
                            const res = data.testResults.find(tr => tr.testId === test.id && tr.studentId === student.id);
                            return (
                              <tr key={student.id} className="group">
                                <td className="py-3 font-medium text-slate-700">{student.name}</td>
                                <td className="py-3 text-slate-600">{res?.listening || '-'}</td>
                                <td className="py-3 text-slate-600">{res?.reading || '-'}</td>
                                <td className="py-3 text-slate-600">{res?.writing || '-'}</td>
                                <td className="py-3 text-slate-600">{res?.speaking || '-'}</td>
                                <td className="py-3 font-bold text-indigo-600">{res?.overall || '-'}</td>
                                <td className="py-3">
                                  <button 
                                    onClick={() => setMarkingTest({ testId: test.id, studentId: student.id })}
                                    className="text-xs font-bold text-indigo-600 hover:underline"
                                  >
                                    {res ? 'Edit' : 'Enter Scores'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-8">
              <Card className="p-8">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-100">
                    {currentUser?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{currentUser?.name}</h3>
                    <p className="text-slate-500">{currentUser?.role} Account</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="success">Verified</Badge>
                      <Badge variant="neutral">{currentUser?.email}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Display Name" defaultValue={currentUser?.name} />
                    <Input label="Email Address" defaultValue={currentUser?.email} disabled />
                  </div>
                  <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="outline">Reset Password</Button>
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Security & Privacy</h4>
                    <p className="text-xs text-slate-500">Manage your account security settings</p>
                  </div>
                </Card>
                <Card className="p-6 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <HelpCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Help & Support</h4>
                    <p className="text-xs text-slate-500">Get help with using the tracker</p>
                  </div>
                </Card>
              </div>

              <Button variant="outline" className="w-full justify-center text-rose-600 border-rose-100 hover:bg-rose-50 hover:text-rose-700">
                <LogOut size={18} /> Sign Out
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddStudent(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">Add New Student</h3>
                <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
              <form className="p-6 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const student = {
                  name: formData.get('name') as string,
                  classId: formData.get('classId') as string,
                  teacherId: formData.get('teacherId') as string,
                  taId: formData.get('taId') as string,
                  currentBand: parseFloat(formData.get('currentBand') as string),
                  targetBand: parseFloat(formData.get('targetBand') as string),
                  startDate: formData.get('startDate') as string,
                  endDate: formData.get('endDate') as string,
                  status: 'Active' as const,
                  notes: ''
                };
                await api.addStudent(student);
                setShowAddStudent(false);
                loadData();
              }}>
                <Input label="Full Name" name="name" required />
                <div className="grid grid-cols-1 gap-4">
                  <Select 
                    label="Class" 
                    name="classId" 
                    options={uniqueClasses.map(c => c.name)} 
                    required 
                    onChange={(e) => {
                      const cls = uniqueClasses.find(c => c.name === e.target.value);
                      if (cls) {
                        const classData = data.classes.find(c => c.id === cls.id);
                        if (classData) {
                          // Auto-fill teacher and TA based on class
                          const teacherInput = document.querySelector('select[name="teacherId"]') as HTMLSelectElement;
                          const taInput = document.querySelector('select[name="taId"]') as HTMLSelectElement;
                          if (teacherInput) teacherInput.value = data.users.find(u => u.id === classData.teacherId)?.name || '';
                          if (taInput) taInput.value = data.users.find(u => u.id === classData.taId)?.name || '';
                        }
                      }
                    }}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Teacher" name="teacherId" options={uniqueTeachers.map(t => t.name)} required />
                    <Select label="TA" name="taId" options={data.users.filter(u => u.role === 'TA').map(u => u.name)} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Current Band" name="currentBand" type="number" step="0.5" min="0" max="9" required />
                  <Input label="Target Band" name="targetBand" type="number" step="0.5" min="0" max="9" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Start Date" name="startDate" type="date" required />
                  <Input label="End Date" name="endDate" type="date" required />
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 justify-center h-11" onClick={() => setShowAddStudent(false)}>Cancel</Button>
                  <Button className="flex-1 justify-center h-11">Add Student</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Class Modal */}
      <AnimatePresence>
        {showAddClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddClass(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">Create New Class</h3>
                <button onClick={() => setShowAddClass(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><Plus className="rotate-45" size={24} /></button>
              </div>
              <form className="p-6 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const cls = {
                  name: formData.get('name') as string,
                  level: formData.get('level') as string,
                  teacherId: uniqueTeachers.find(t => t.name === formData.get('teacherId'))?.id || '',
                  taId: data.users.find(u => u.name === formData.get('taId'))?.id || '',
                  startDate: formData.get('startDate') as string,
                  endDate: formData.get('endDate') as string,
                  schedule: formData.get('schedule') as string,
                  status: 'Active' as const
                };
                await api.addClass(cls);
                setShowAddClass(false);
                loadData();
              }}>
                <Input label="Class Name" name="name" placeholder="e.g. IELTS Advanced A" required />
                <Select label="Level" name="level" options={['Beginner', 'Intermediate', 'Advanced', 'Intensive']} required />
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Teacher" name="teacherId" options={uniqueTeachers.map(t => t.name)} required />
                  <Select label="TA" name="taId" options={data.users.filter(u => u.role === 'TA').map(u => u.name)} required />
                </div>
                <Input label="Schedule" name="schedule" placeholder="e.g. Mon/Wed 6-8pm" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Start Date" name="startDate" type="date" required />
                  <Input label="End Date" name="endDate" type="date" required />
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 justify-center h-11" onClick={() => setShowAddClass(false)}>Cancel</Button>
                  <Button className="flex-1 justify-center h-11">Create Class</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Homework Modal */}
      <AnimatePresence>
        {showAddHomework && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddHomework(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">Assign Homework</h3>
                <button onClick={() => setShowAddHomework(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><Plus className="rotate-45" size={24} /></button>
              </div>
              <form className="p-6 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const hw = {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  classId: uniqueClasses.find(c => c.name === formData.get('classId'))?.id || '',
                  assignedById: currentUser?.id || '',
                  assignedDate: new Date().toISOString(),
                  dueDate: formData.get('dueDate') as string,
                  skillCategory: formData.get('skillCategory') as any,
                  status: 'Assigned' as const
                };
                await api.assignHomework(hw);
                setShowAddHomework(false);
                loadData();
              }}>
                <Input label="Homework Title" name="title" required />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                  <textarea name="description" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm h-24" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Class" name="classId" options={uniqueClasses.map(c => c.name)} required />
                  <Select label="Skill Category" name="skillCategory" options={['Writing', 'Speaking', 'Listening', 'Reading', 'Grammar', 'Vocabulary']} required />
                </div>
                <Input label="Due Date" name="dueDate" type="date" required />
                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 justify-center h-11" onClick={() => setShowAddHomework(false)}>Cancel</Button>
                  <Button className="flex-1 justify-center h-11">Assign</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Test Modal */}
      <AnimatePresence>
        {showAddTest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddTest(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">Create New Test</h3>
                <button onClick={() => setShowAddTest(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><Plus className="rotate-45" size={24} /></button>
              </div>
              <form className="p-6 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const test = {
                  title: formData.get('title') as string,
                  type: formData.get('type') as any,
                  classId: uniqueClasses.find(c => c.name === formData.get('classId'))?.id || '',
                  assignedById: currentUser?.id || '',
                  date: formData.get('date') as string,
                  skillsAssessed: ['Writing', 'Speaking', 'Listening', 'Reading'], // Default all for IELTS
                  maxScore: 9,
                  notes: ''
                };
                await api.assignTest(test);
                setShowAddTest(false);
                loadData();
              }}>
                <Input label="Test Title" name="title" placeholder="e.g. Mock Test #1" required />
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Type" name="type" options={['Mock Test', 'Mid-term', 'Final', 'Quiz']} required />
                  <Select label="Class" name="classId" options={uniqueClasses.map(c => c.name)} required />
                </div>
                <Input label="Test Date" name="date" type="date" required />
                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 justify-center h-11" onClick={() => setShowAddTest(false)}>Cancel</Button>
                  <Button className="flex-1 justify-center h-11">Create Test</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mark Homework Modal */}
      <AnimatePresence>
        {markingHomework && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMarkingHomework(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">Mark Homework</h3>
                <button onClick={() => setMarkingHomework(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><Plus className="rotate-45" size={24} /></button>
              </div>
              <form className="p-6 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const submission = {
                  homeworkId: markingHomework.hwId,
                  studentId: markingHomework.studentId,
                  submittedDate: new Date().toISOString(),
                  status: formData.get('status') as any,
                  score: parseFloat(formData.get('score') as string),
                  feedback: formData.get('feedback') as string,
                  markedById: currentUser?.id || ''
                };
                await api.markHomework(submission);
                setMarkingHomework(null);
                loadData();
              }}>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Status" name="status" options={['Submitted', 'Reviewed', 'Late', 'Incomplete']} required />
                  <Input label="Score (0-10)" name="score" type="number" step="0.1" min="0" max="10" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Feedback</label>
                  <textarea name="feedback" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm h-24" required />
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 justify-center h-11" onClick={() => setMarkingHomework(null)}>Cancel</Button>
                  <Button className="flex-1 justify-center h-11">Save Grade</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mark Test Modal */}
      <AnimatePresence>
        {markingTest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMarkingTest(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">Enter Test Scores</h3>
                <button onClick={() => setMarkingTest(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><Plus className="rotate-45" size={24} /></button>
              </div>
              <form className="p-6 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const l = parseFloat(formData.get('listening') as string);
                const r = parseFloat(formData.get('reading') as string);
                const w = parseFloat(formData.get('writing') as string);
                const s = parseFloat(formData.get('speaking') as string);
                const overall = Math.round(((l + r + w + s) / 4) * 2) / 2;

                const result = {
                  testId: markingTest.testId,
                  studentId: markingTest.studentId,
                  listening: l,
                  reading: r,
                  writing: w,
                  speaking: s,
                  overall: overall,
                  notes: formData.get('notes') as string,
                  comments: '',
                  markedDate: new Date().toISOString(),
                  dateEntered: new Date().toISOString()
                };
                await api.enterTestResult(result);
                setMarkingTest(null);
                loadData();
              }}>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Listening" name="listening" type="number" step="0.5" min="0" max="9" required />
                  <Input label="Reading" name="reading" type="number" step="0.5" min="0" max="9" required />
                  <Input label="Writing" name="writing" type="number" step="0.5" min="0" max="9" required />
                  <Input label="Speaking" name="speaking" type="number" step="0.5" min="0" max="9" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</label>
                  <textarea name="notes" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm h-20" />
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 justify-center h-11" onClick={() => setMarkingTest(null)}>Cancel</Button>
                  <Button className="flex-1 justify-center h-11">Save Scores</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
