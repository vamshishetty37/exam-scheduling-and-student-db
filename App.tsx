/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StudentModule from './components/StudentModule';
import ExamModule from './components/ExamModule';
import Documentation from './components/Documentation';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'exams' | 'docs'>('dashboard');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'students' && <StudentModule />}
      {activeTab === 'exams' && <ExamModule />}
      {activeTab === 'docs' && <Documentation />}
    </Layout>
  );
}

