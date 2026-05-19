import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart3, Users, Calendar, TrendingUp, AlertCircle, PieChart as PieIcon, Database, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [stats, setStats] = useState({
    studentsCount: 0,
    examsCount: 0,
    avgGPA: 0,
    urgentExams: 0
  });

  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [courseData, setCourseData] = useState<any[]>([]);

  const seedData = async () => {
    setIsSeeding(true);
    try {
      const sampleStudents = [
        { name: "John Doe", course: "Computer Science", gpa: 8.5 },
        { name: "Jane Smith", course: "Mathematics", gpa: 9.2 },
        { name: "Robert Wilson", course: "Physics", gpa: 7.8 },
        { name: "Emily Brown", course: "Literature", gpa: 8.9 },
        { name: "Michael Chang", course: "Economics", gpa: 9.5 }
      ];

      const sampleExams = [
        { subject: "Data Structures", date: "2024-06-15T09:00", room: "LT-101", priority: 9 },
        { subject: "Quantum Physics", date: "2024-06-20T14:00", room: "Lab-3", priority: 10 },
        { subject: "Advanced Calculus", date: "2024-06-12T10:00", room: "Room-202", priority: 7 },
        { subject: "Microeconomics", date: "2024-06-18T11:00", room: "Hall-B", priority: 6 }
      ];

      for (const s of sampleStudents) {
        await addDoc(collection(db, 'students'), {
          ...s,
          priority: s.gpa * 10,
          createdAt: serverTimestamp()
        });
      }

      for (const e of sampleExams) {
        await addDoc(collection(db, 'exams'), {
          ...e,
          createdAt: serverTimestamp()
        });
      }

      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err) {
      console.error("Seeding failed:", err);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Listen for students
    const unsubStudents = onSnapshot(query(collection(db, 'students')), (snapshot) => {
      const count = snapshot.size;
      const docs = snapshot.docs.map(d => d.data());
      const totalGPA = docs.reduce((acc, d) => acc + (d.gpa || 0), 0);
      
      setStats(prev => ({ 
        ...prev, 
        studentsCount: count,
        avgGPA: count > 0 ? (totalGPA / count) : 0
      }));

      // Prepare Performance Distribution (Suggestions 6)
      const ranges = [
        { name: '0-2', count: 0, color: '#FF6B6B' },
        { name: '2-4', count: 0, color: '#F59E0B' },
        { name: '4-6', count: 0, color: '#3B82F6' },
        { name: '6-8', count: 0, color: '#4F46E5' },
        { name: '8-10', count: 0, color: '#10B981' }
      ];

      docs.forEach(d => {
        const g = d.gpa || 0;
        if (g <= 2) ranges[0].count++;
        else if (g <= 4) ranges[1].count++;
        else if (g <= 6) ranges[2].count++;
        else if (g <= 8) ranges[3].count++;
        else ranges[4].count++;
      });
      setPerformanceData(ranges);

      // Prepare Course Stats
      const courses: Record<string, number> = {};
      docs.forEach(d => {
        if (d.course) courses[d.course] = (courses[d.course] || 0) + 1;
      });
      setCourseData(Object.entries(courses).map(([name, value]) => ({ name, value })));
    });

    // Listen for exams
    const unsubExams = onSnapshot(query(collection(db, 'exams')), (snapshot) => {
      const count = snapshot.size;
      const urgentCount = snapshot.docs.filter(d => d.data().priority >= 8).length;
      setStats(prev => ({ 
        ...prev, 
        examsCount: count,
        urgentExams: urgentCount
      }));
    });

    return () => {
      unsubStudents();
      unsubExams();
    };
  }, [user]);

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Systems Overview</h2>
          <p className="text-[#9E9E9E] font-medium">Real-time status of academic records and scheduling.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={seedData}
            disabled={isSeeding}
            className={cn(
              "bg-white border border-[#E5E5E5] rounded-2xl px-6 py-3 flex items-center gap-3 shadow-sm transition-all hover:border-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed",
              seedSuccess && "border-green-500 bg-green-50"
            )}
          >
            {isSeeding ? (
              <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
            ) : seedSuccess ? (
              <Check className="text-green-500" size={20} />
            ) : (
              <Database size={20} className="text-[#9E9E9E]" />
            )}
            <div className="text-left hidden sm:block">
              <span className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider leading-none">Seed Logic</span>
              <span className="text-[10px] text-[#9E9E9E] font-medium leading-none">Sample Data</span>
            </div>
          </button>

          <div className="bg-white border border-[#E5E5E5] rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#F5F5F5] flex items-center justify-center text-[10px] font-bold">
                  U{i}
                </div>
              ))}
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#1A1A1A]">Admin Access</span>
              <div className="text-[#9E9E9E] font-medium">asia-southeast1 node</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users size={24} />} 
          label="Total Students" 
          value={stats.studentsCount.toString()} 
          subValue="Active enrollment"
          color="bg-[#4F46E5]"
        />
        <StatCard 
          icon={<Calendar size={24} />} 
          label="Scheduled Exams" 
          value={stats.examsCount.toString()} 
          subValue="Next 30 days"
          color="bg-[#FF6B6B]"
        />
        <StatCard 
          icon={<TrendingUp size={24} />} 
          label="Avg. Perf Metric" 
          value={stats.avgGPA.toFixed(2)} 
          subValue="Class of 2024"
          color="bg-[#10B981]"
        />
        <StatCard 
          icon={<AlertCircle size={24} />} 
          label="Urgent Alerts" 
          value={stats.urgentExams.toString()} 
          subValue="High priority items"
          color="bg-[#F59E0B]"
        />
      </div>

      {/* Visual Feature Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-[#E5E5E5] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-[#4F46E5] bg-opacity-10 text-[#4F46E5] rounded-xl flex items-center justify-center">
                 <BarChart3 size={20} />
               </div>
               <h3 className="text-lg font-bold">Performance Distribution</h3>
             </div>
             <span className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">CGPA Scale 10.0</span>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9E9E9E' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9E9E9E' }}
                />
                <Tooltip 
                  cursor={{ fill: '#F9F9F9' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-full px-4 py-1 mb-8">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5F5F5]">Algorithm Active</span>
            </div>
            
            <h3 className="text-3xl font-bold leading-tight mb-6">
              Heap Sort <br/> 
              <span className="text-[#9E9E9E]">Priority Logic</span>
            </h3>
            
            <p className="text-[#F5F5F5] text-opacity-60 max-w-sm mb-10 text-sm leading-relaxed font-light">
              Our implementation ensures O(n log n) efficiency for sorting both top performing students and urgent exam schedules.
            </p>
            
            <div className="flex gap-4">
              <div className="h-1 w-20 bg-white" />
              <div className="h-1 w-10 bg-white opacity-40" />
              <div className="h-1 w-5 bg-white opacity-20" />
            </div>
          </div>
          
          <div className="absolute right-0 top-0 w-1/2 h-full">
            <svg viewBox="0 0 400 400" className="w-full h-full opacity-10">
              <motion.path 
                d="M50 200 L150 100 L250 300 L350 200"
                stroke="white"
                strokeWidth="4"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-[#E5E5E5] p-10 shadow-sm flex flex-col">
           <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-pink-500 bg-opacity-10 text-pink-500 rounded-xl flex items-center justify-center">
               <PieIcon size={20} />
             </div>
             <h3 className="text-lg font-bold">Course Mix</h3>
           </div>
           
           <div className="h-48 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {courseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#4F46E5', '#10B981', '#FF6B6B', '#F59E0B', '#3B82F6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
           </div>

           <div className="space-y-4">
              {courseData.slice(0, 3).map((course, idx) => (
                <div key={course.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#4F46E5', '#10B981', '#FF6B6B'][idx] }} />
                    <span className="text-xs font-bold text-[#4A4A4A]">{course.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold">{course.value}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-[#E5E5E5] p-10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Recent Academic Alerts</h3>
            <button className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-widest hover:underline">View All</button>
          </div>
          
          <div className="space-y-6">
            <AlertItem title="CGPA Migration Process" time="2h ago" type="system" />
            <AlertItem title="Heap Sort Recalculation" time="5h ago" type="algorithm" />
            <AlertItem title="Backup Node Syncing" time="12h ago" type="network" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ title, time, type }: { title: string, time: string, type: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#F9F9F9] rounded-2xl border border-transparent hover:border-[#E5E5E5] transition-all">
      <div className="flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-[#10B981]" />
        <div>
          <p className="text-sm font-bold text-[#1A1A1A]">{title}</p>
          <p className="text-[10px] font-bold text-[#9E9E9E] uppercase">{type}</p>
        </div>
      </div>
      <span className="text-[10px] font-bold text-[#9E9E9E]">{time}</span>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, color }: { icon: React.ReactNode, label: string, value: string, subValue: string, color: string }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow">
      <div className={`${color} bg-opacity-10 w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
        <div className={color.replace('bg-', 'text-')}>
          {icon}
        </div>
      </div>
      <div className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-bold tracking-tight mb-2">{value}</div>
      <div className="text-[10px] font-bold text-[#1A1A1A] bg-[#F5F5F5] inline-block px-2 py-0.5 rounded uppercase">{subValue}</div>
    </div>
  );
}

function DistributionRow({ label, percent }: { label: string, percent: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-5 bg-[#F5F5F5] rounded-lg overflow-hidden flex">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="bg-[#1A1A1A] h-full"
        />
      </div>
    </div>
  );
}
