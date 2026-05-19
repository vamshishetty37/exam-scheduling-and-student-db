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
import { UserPlus, UserMinus, SortAsc, GraduationCap, Search, FileText, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import * as pdfjs from 'pdfjs-dist';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface Student {
  id: string;
  name: string;
  course: string;
  gpa: number;
  priority: number;
}

export default function StudentModule() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSorting, setIsSorting] = useState(false);

  // New Student Form
  const [newName, setNewName] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newGPA, setNewGPA] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError('');

    try {
      const text = await extractTextFromPdf(file);
      
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('Failed to parse PDF with AI');

      const parsedStudents = await response.json();
      
      // Batch add to Firestore
      for (const s of parsedStudents) {
        await addDoc(collection(db, 'students'), {
          name: s.name,
          course: s.course,
          gpa: s.gpa,
          priority: s.gpa * 10,
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      setParseError(err.message || 'Error importing PDF');
    } finally {
      setIsParsing(false);
      if (e.target) e.target.value = '';
    }
  };

  const fillSampleStudent = () => {
    const samples = [
      { name: 'Alice Johnson', course: 'Cyber Security', gpa: '9.45' },
      { name: 'Bob Smith', course: 'Artificial Intelligence', gpa: '8.20' },
      { name: 'Charlie Davis', course: 'Data Science', gpa: '7.85' },
      { name: 'Diana Prince', course: 'Cloud Computing', gpa: '9.10' }
    ];
    const random = samples[Math.floor(Math.random() * samples.length)];
    setNewName(random.name);
    setNewCourse(random.course);
    setNewGPA(random.gpa);
  };

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });

    return () => unsubscribe();
  }, [user]);

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCourse || !newGPA) return;

    try {
      await addDoc(collection(db, 'students'), {
        name: newName,
        course: newCourse,
        gpa: parseFloat(newGPA),
        priority: parseFloat(newGPA) * 10, // Priority based on GPA for demo
        createdAt: serverTimestamp()
      });
      setNewName('');
      setNewCourse('');
      setNewGPA('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'students');
    }
  };

  const removeStudent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `students/${id}`);
    }
  };

  const applyHeapSort = () => {
    setIsSorting(true);
    setTimeout(() => {
      const sorted = heapSort<Student>(students, (a, b) => b.gpa - a.gpa);
      setStudents(sorted);
      setIsSorting(false);
    }, 500);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Course', 'CGPA'];
    const data = students.map(s => [s.name, s.course, s.gpa.toFixed(2)]);
    const csvContent = [headers, ...data].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_records_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar: Add Student */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-sm sticky top-32">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#4F46E5] bg-opacity-10 text-[#4F46E5] rounded-xl flex items-center justify-center">
                <UserPlus size={20} />
              </div>
              <h2 className="text-lg font-bold">New Admission</h2>
            </div>
            <button 
              onClick={fillSampleStudent}
              type="button"
              className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-widest bg-[#4F46E5] bg-opacity-10 px-2 py-1 rounded-md hover:bg-opacity-20 transition-all"
            >
              Fill Sample
            </button>
          </div>

          <form onSubmit={addStudent} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-1 block">Full Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-[#F9F9F9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#4F46E5] transition-all"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-1 block">Course</label>
              <input 
                type="text" 
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full bg-[#F9F9F9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#4F46E5] transition-all"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-1 block">CGPA (0.0 - 10.0)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                max="10"
                value={newGPA}
                onChange={(e) => setNewGPA(e.target.value)}
                placeholder="8.50"
                className="w-full bg-[#F9F9F9] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#4F46E5] transition-all"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-[#1A1A1A] text-white rounded-xl py-3 text-sm font-bold shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <GraduationCap size={18} />
              Register Student
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-sm sticky top-[480px] mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#10B981] bg-opacity-10 text-[#10B981] rounded-xl flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Import Records</h2>
              <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-wider">PDF Extraction</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-[#9E9E9E] leading-relaxed">
              Upload a student list PDF. Our AI will automatically extract names, courses, and marks.
            </p>
            
            {parseError && (
              <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 uppercase tracking-tight">
                {parseError}
              </div>
            )}

            <label className={cn(
              "w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer",
              isParsing ? "bg-[#F5F5F5] border-[#E5E5E5]" : "border-[#E5E5E5] hover:border-[#1A1A1A] hover:bg-[#F9F9F9]"
            )}>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handlePdfImport}
                disabled={isParsing}
                className="hidden"
              />
              {isParsing ? (
                <>
                  <Loader2 size={24} className="text-[#1A1A1A] animate-spin" />
                  <span className="text-xs font-bold text-[#1A1A1A]">AI Parsing...</span>
                </>
              ) : (
                <>
                  <FileText size={24} className="text-[#9E9E9E]" />
                  <span className="text-xs font-bold text-[#9E9E9E]">Select PDF File</span>
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Main: Student List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={18} />
            <input 
              type="text"
              placeholder="Search by name or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E5E5E5] rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#4F46E5] transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={applyHeapSort}
            disabled={isSorting || students.length < 2}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm shrink-0",
              isSorting ? "bg-[#F5F5F5] text-[#9E9E9E]" : "bg-white text-[#1A1A1A] border border-[#E5E5E5] hover:border-[#1A1A1A]"
            )}
          >
            <SortAsc size={18} className={isSorting ? "animate-spin" : ""} />
            {isSorting ? "Sorting..." : "Heap Sort (Top CGPA)"}
          </button>
          
          <button 
            onClick={exportToCSV}
            disabled={students.length === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm bg-[#1A1A1A] text-white hover:bg-opacity-90 disabled:opacity-50 shrink-0"
          >
            <div className="w-5 h-5 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Search size={14} className="rotate-45" />
            </div>
            Export CSV
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-sm">
          {searchTerm && (
            <div className="px-6 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">Search Active</span>
              <span className="text-xs font-bold text-[#4F46E5] bg-[#4F46E5] bg-opacity-10 px-2 py-1 rounded-md">
                {filteredStudents.length} {filteredStudents.length === 1 ? 'Result' : 'Results'} Found
              </span>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9F9] border-bottom border-[#E5E5E5]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider">Student Profile</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider text-center">CGPA</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#9E9E9E] italic">Loading records...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#9E9E9E] italic">No student records found.</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#F9F9F9] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#1A1A1A] font-bold text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-sm">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-[#4A4A4A] bg-[#F5F5F5] px-2 py-1 rounded-md">{student.course}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "font-mono font-bold text-sm",
                        student.gpa >= 8.5 ? "text-green-600" : student.gpa >= 7.0 ? "text-blue-600" : "text-amber-600"
                      )}>
                        {student.gpa.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => removeStudent(student.id)}
                        className="text-[#9E9E9E] hover:text-red-500 transition-colors p-2"
                      >
                        <UserMinus size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
