"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Award, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

function ResultManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [section, setSection] = useState("A");

  const [roster, setRoster] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sections = ["A", "B", "C"];

  // Fetch Exams list
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/exams`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          setExams(data.data);
        }
      } catch (err) {
        console.error("Failed to load exams", err);
      }
    };
    fetchExams();
  }, []);

  const handleLoadSheet = async () => {
    if (!selectedExamId) {
      setError("Please select an exam first.");
      return;
    }
    setLoading(true);
    setError("");
    setLoaded(false);
    try {
      const response = await fetch(`${apiBaseUrl}/api/results/sheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ exam_id: selectedExamId, section })
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setRoster(data.data);
        setLoaded(true);
      } else {
        setError(data.message || "Failed to load result sheets.");
      }
    } catch (err) {
      setError("Network error loading scores sheet.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId, obMarks) => {
    setRoster(prev => prev.map(st => {
      if (String(st.student_id) === String(studentId)) {
        const marks = parseFloat(obMarks) || 0;
        const total = parseFloat(st.total_marks) || 100;
        const pct = (marks / total) * 100;
        
        let grade = "F";
        let isPass = 0;
        if (pct >= 80) { grade = "A+"; isPass = 1; }
        else if (pct >= 70) { grade = "A"; isPass = 1; }
        else if (pct >= 60) { grade = "B"; isPass = 1; }
        else if (pct >= 50) { grade = "C"; isPass = 1; }
        else if (pct >= 40) { grade = "D"; isPass = 1; }

        return { ...st, obtained_marks: obMarks, grade, is_pass: isPass };
      }
      return st;
    }));
  };

  const handleSaveResults = async () => {
    setSaving(true);
    setError("");
    const records = roster.map(st => ({
      student_id: st.student_id,
      obtained_marks: parseFloat(st.obtained_marks) || 0,
      grade: st.grade || "F",
      is_pass: st.is_pass || 0
    }));

    try {
      const response = await fetch(`${apiBaseUrl}/api/results/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ exam_id: selectedExamId, records })
      });
      const data = await response.json();
      if (data.status === "success") {
        alert("Exam grades sheet saved successfully!");
      } else {
        setError(data.message || "Failed to save results sheet.");
      }
    } catch (err) {
      setError("Network error saving results sheet.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const selectedExam = exams.find(e => String(e.id) === String(selectedExamId));

  
  // Real-time synchronization listener
  const handleLoadSheetRef = useRef(handleLoadSheet);
  useEffect(() => {
    handleLoadSheetRef.current = handleLoadSheet;
  }, [handleLoadSheet]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'RESULTS' || change.type === 'EXAMS' || change.type === 'STUDENTS') {
        console.log(`Socket update received for ResultManager.jsx: `, change);
        handleLoadSheetRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      
      {/* Config Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Scheduled Exam Term</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Choose Exam Term --</option>
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.title} - {ex.class} ({ex.subject})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full bg-slate-50 rounded-xl px-3.5 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
            >
              {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>

          <button
            onClick={handleLoadSheet}
            disabled={loading}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target flex items-center justify-center disabled:opacity-50"
          >
            <span>Load Marksheet</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
        </div>
      ) : loaded ? (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500">
              Exam: <strong>{selectedExam?.title}</strong> · Subject: <strong>{selectedExam?.subject}</strong> (Out of {selectedExam?.total_marks || 100})
            </span>
            
            <button
              onClick={handleSaveResults}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-green-500/10 transition-all duration-150 active:scale-95 touch-target flex items-center justify-center disabled:opacity-50 w-full sm:w-auto"
            >
              <span>Save Marks Registry</span>
            </button>
          </div>

          {/* Scores Roster */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6 w-24">Roll No</th>
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">Father Name</th>
                    <th className="py-4 px-6 text-center w-48">Obtained Marks</th>
                    <th className="py-4 px-6 text-center w-24">Grade</th>
                    <th className="py-4 px-6 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {roster.map((st) => (
                    <tr key={st.student_id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-semibold text-slate-900">{st.roll_no || '-'}</td>
                      <td className="py-4 px-6 font-semibold text-slate-800">{st.name}</td>
                      <td className="py-4 px-6 text-slate-500">{st.father_name}</td>
                      <td className="py-4 px-6 text-center">
                        <input
                          type="number"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-center text-sm font-semibold w-24 focus:outline-none focus:border-sky-500 focus:bg-white"
                          value={st.obtained_marks !== null ? st.obtained_marks : ""}
                          onChange={(e) => handleMarksChange(st.student_id, e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-sky-600">{st.grade || 'F'}</td>
                      <td className="py-4 px-6 text-center font-bold">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          st.is_pass ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                          {st.is_pass ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards List View */}
            <div className="divide-y divide-slate-100 md:hidden">
              {roster.map((st) => (
                <div key={st.student_id} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold">Roll {st.roll_no || '-'}</span>
                      <h4 className="font-bold text-slate-800 text-sm">{st.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-600 text-sm">{st.grade || 'F'}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        st.is_pass ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {st.is_pass ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Marks:</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center text-sm font-semibold w-28 focus:outline-none focus:border-sky-500 focus:bg-white touch-target"
                      value={st.obtained_marks !== null ? st.obtained_marks : ""}
                      onChange={(e) => handleMarksChange(st.student_id, e.target.value)}
                      placeholder="0"
                    />
                    <span className="text-xs text-slate-400">/ {selectedExam?.total_marks || 100}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 text-sm">
          <Award className="mx-auto mb-3 opacity-30" size={36} />
          Choose an exam term, select section, and click Load Marksheet.
        </div>
      )}

    </div>
  );
}

export default ResultManager;
