import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { heapSort } from '../lib/heapSort';
import { CalendarPlus, Trash2, Clock, MapPin, ListFilter, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface Exam {
  id: string;
  subject: string;
  date: string;
  room: string;
  priority: number;
}

export default function ExamModule() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);

  // New Exam Form
  const [newSubject, setNewSubject] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newPriority, setNewPriority] = useState(5);

  const fillSampleExam = () => {
    const samples = [
      { subject: 'Operating Systems', room: 'Hall A', priority: 8 },
      { subject: 'Database Management', room: 'Lab 2', priority: 6 },
      { subject: 'Computer Networks', room: 'Room 303', priority: 9 },
      { subject: 'Software Engineering', room: 'Lecture Theta', priority: 7 }
    ];
    const random = samples[Math.floor(Math.random() * samples.length)];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    setNewSubject(random.subject);
    setNewRoom(random.room);
    setNewPriority(random.priority);
    setNewDate(tomorrow.toISOString().slice(0, 16));
  };

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'exams'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Exam[];
      setExams(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'exams');
    });

    return () => unsubscribe();
  }, [user]);

  const addExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newDate || !newRoom) return;

    try {
      await addDoc(collection(db, 'exams'), {
        subject: newSubject,
        date: newDate,
        room: newRoom,
        priority: newPriority,
        createdAt: serverTimestamp()
      });
      setNewSubject('');
      setNewDate('');
      setNewRoom('');
      setNewPriority(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'exams');
    }
  };

  const removeExam = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'exams', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `exams/${id}`);
    }
  };

  const applyHeapSort = () => {
    setIsSorting(true);
    setTimeout(() => {
      // Sort by priority (Max heap)
      const sorted = heapSort<Exam>(exams, (a, b) => b.priority - a.priority);
      setExams(sorted);
      setIsSorting(false);
    }, 500);
  };

  const exportToICS = (exam: Exam) => {
    const startDate = new Date(exam.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:EXAM: ${exam.subject}`,
      `LOCATION:${exam.room}`,
      `DESCRIPTION:Examination prioritized via Heap Sort (Level ${exam.priority})`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exam.subject.replace(/\s+/g, '_')}_exam.ics`;
    link.click();
  };

  return (
    <div className="space-y-8">
      {/* Top Section: Form and Actions */}
      <div className="flex flex-col xl:flex-row gap-8">
        <div className="w-full xl:w-1/3">
          <div className="bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF6B6B] bg-opacity-10 text-[#FF6B6B] rounded-xl flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <h2 className="text-lg font-bold">Schedule Exam</h2>
              </div>
              <button 
                onClick={fillSampleExam}
                type="button"
                className="text-[10px] font-bold text-[#FF6B6B] uppercase tracking-widest bg-[#FF6B6B] bg-opacity-10 px-2 py-1 rounded-md hover:bg-opacity-20 transition-all"
              >
                Fill Sample
              </button>
            </div>

            <form onSubmit={addExam} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-1 block">Subject Name</label>
                <input 
                  type="text" 
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Advanced Mathematics"
                  className="w-full bg-[#F9F9F9] border-none rounded-xl px-4 py-3 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-1 block">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#F9F9F9] border-none rounded-xl px-4 py-3 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-1 block">Room</label>
                  <input 
                    type="text" 
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="Hall 4B"
                    className="w-full bg-[#F9F9F9] border-none rounded-xl px-4 py-3 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-1 block">Priority Level: {newPriority}</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={newPriority}
                  onChange={(e) => setNewPriority(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#F5F5F5] rounded-lg appearance-none cursor-pointer accent-[#1A1A1A]"
                />
                <div className="flex justify-between text-[10px] text-[#9E9E9E] mt-1 font-bold">
                  <span>LOW</span>
                  <span>URGENT</span>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-[#1A1A1A] text-white rounded-xl py-4 text-sm font-bold shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Create Schedule
              </button>
            </form>
          </div>
        </div>

        <div className="w-full xl:w-2/3 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#9E9E9E]">Upcoming Examination Slots</h3>
            <button 
              onClick={applyHeapSort}
              disabled={isSorting || exams.length < 2}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all border border-[#E5E5E5] bg-white",
                isSorting ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F9F9F9]"
              )}
            >
              <ListFilter size={16} className={isSorting ? "animate-pulse" : ""} />
              Sort by Urgency (Heap)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full py-20 text-center text-[#9E9E9E] font-medium italic">Scanning schedule...</div>
            ) : exams.length === 0 ? (
              <div className="col-span-full py-20 bg-white border border-dashed border-[#E5E5E5] rounded-3xl flex flex-col items-center justify-center gap-3">
                <AlertCircle className="text-[#E5E5E5]" size={40} />
                <p className="text-[#9E9E9E] text-sm">No exams scheduled yet.</p>
              </div>
            ) : (
              exams.map((exam) => (
                <div 
                  key={exam.id} 
                  className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div 
                    className={cn(
                      "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-110",
                      exam.priority >= 8 ? "bg-red-500" : exam.priority >= 5 ? "bg-amber-500" : "bg-blue-500"
                    )}
                  />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg mb-1 leading-tight">{exam.subject}</h4>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                          exam.priority >= 8 ? "bg-red-50 text-red-600" : exam.priority >= 5 ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                        )}>
                          Prior {exam.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => exportToICS(exam)}
                        className="text-[#E5E5E5] hover:text-[#4F46E5] transition-colors p-1"
                        title="Export to iCal"
                      >
                        <CalendarPlus size={18} />
                      </button>
                      <button 
                        onClick={() => removeExam(exam.id)}
                        className="text-[#E5E5E5] hover:text-red-500 transition-colors p-1"
                        title="Delete Schedule"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4 pt-4 border-t border-[#F9F9F9]">
                    <div className="flex items-center gap-3 text-[#4A4A4A]">
                      <Clock size={16} className="text-[#9E9E9E]" />
                      <span className="text-xs font-semibold">
                        {format(new Date(exam.date), 'MMM do, yyyy • h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[#4A4A4A]">
                      <MapPin size={16} className="text-[#9E9E9E]" />
                      <span className="text-xs font-bold tracking-tight uppercase">{exam.room}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
