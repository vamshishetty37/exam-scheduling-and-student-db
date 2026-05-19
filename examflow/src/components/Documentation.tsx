import React from 'react';
import { BookOpen, Code2, LineChart, Cpu, Info, CheckCircle2 } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-[#1A1A1A]">Technical Documentation</h2>
        <p className="text-[#9E9E9E] text-lg font-medium">
          A comprehensive breakdown of the ExamFlow management system architecture and the Heap Sort algorithm.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Project Description */}
        <DocCard 
          icon={<Info className="text-blue-500" />}
          title="Project Description"
        >
          <p>
            ExamFlow is a professional-grade administrative platform designed for modern academic institutions. 
            It specializes in two core domains: **Student Record Management** and **Automated Exam Scheduling**. 
            The system provides a real-time interface for registering students, tracking performance (CGPA), 
            and managing complex examination timelines across multiple venues.
          </p>
        </DocCard>

        {/* Algorithm and Flowchart */}
        <DocCard 
          icon={<Cpu className="text-purple-500" />}
          title="Algorithm and Flowchart"
        >
          <div className="space-y-3">
            <p>
              The system utilizes a **Max-Heap Algorithm** for its core prioritization engine. 
              The process follows these logical steps:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#4A4A4A] ml-2">
              <li>Build a Max-Heap from the unsorted data.</li>
              <li>Extract the root (maximum element) and move it to the end.</li>
              <li>Reduce heap size and 'heapify' the root to maintain priority.</li>
              <li>Repeat until the array is fully ordered by priority level.</li>
            </ul>
          </div>
        </DocCard>

        {/* Implementation */}
        <DocCard 
          icon={<Code2 className="text-emerald-500" />}
          title="Implementation"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-2">Frontend Stack</h4>
              <ul className="text-xs space-y-1 font-medium">
                <li>• React 18 (Vite)</li>
                <li>• Tailwind CSS 4.0</li>
                <li>• Motion (Animations)</li>
                <li>• Lucide Icons</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-2">Backend & Data</h4>
              <ul className="text-xs space-y-1 font-medium">
                <li>• Firebase Firestore</li>
                <li>• Firebase Auth</li>
                <li>• Custom HeapSort Hook</li>
                <li>• Real-time Listeners</li>
              </ul>
            </div>
          </div>
        </DocCard>

        {/* Results */}
        <DocCard 
          icon={<CheckCircle2 className="text-orange-500" />}
          title="Results"
        >
          <p>
            Validation tests demonstrate that the system successfully identifies top-performing students on a 10.0 scale and 
            urgent examination slots instantly. The UI responds to the Heap Sort triggers with smooth 
            transitions, allowing administrators to reorganize thousands of records without detectable 
            latency in the sorting process.
          </p>
        </DocCard>

        {/* Time Complexity Analysis */}
        <DocCard 
          icon={<LineChart className="text-indigo-500" />}
          title="Time Complexity Analysis"
        >
          <div className="bg-[#F9F9F9] p-4 rounded-2xl border border-[#E5E5E5] font-mono text-xs">
            <div className="flex justify-between mb-2">
              <span className="text-[#9E9E9E]">Worst Case</span>
              <span className="font-bold">O(n log n)</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-[#9E9E9E]">Best Case</span>
              <span className="font-bold">O(n log n)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9E9E9E]">Space Complexity</span>
              <span className="font-bold">O(1)</span>
            </div>
          </div>
          <p className="mt-4 text-xs">
            Unlike QuickSort, HeapSort ensures a consistent performance ceiling regardless of data distribution, 
            making it ideal for critical scheduling tasks where predictability is paramount.
          </p>
        </DocCard>

        {/* Conclusion */}
        <DocCard 
          icon={<BookOpen className="text-pink-500" />}
          title="Conclusion"
        >
          <p>
            ExamFlow effectively combines modern web technologies with robust computer science fundamentals. 
            By leveraging Heap Sort for data organization, the application provides a scalable and reliable 
            solution for academic logistical challenges, ensuring that priorities are never misplaced in 
            the complexity of school administration.
          </p>
        </DocCard>
      </div>
    </div>
  );
}

function DocCard({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-[#F5F5F5] rounded-2xl flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed text-[#4A4A4A] font-medium">
        {children}
      </div>
    </div>
  );
}
