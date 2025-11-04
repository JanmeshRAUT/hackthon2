'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';

// --- 1. Interface and Type Definitions ---
interface AuditLogEntry {
  who: string;
  role: string;
  action: 'Accessed' | 'Attempted' | 'Restricted';
  resource: string;
  timestamp: string;
  context: string;
  decision_reason: string;
}

type AccessDecision = 'ALLOW' | 'RESTRICT' | 'DENY' | 'PENDING';

// --- 2. Initial State and Mock Data ---
const ROLES = ['Doctor', 'Nurse', 'Admin', 'Lab Technician'];
const LOCATIONS = ['Internal_IP (Hospital)', 'External_IP (Home/Public)'];

const BACKEND_URL = 'http://localhost:5000/api/check-access';
const AUDIT_URL = 'http://localhost:5000/api/patient-log';

// --- 3. Main Component ---
export default function MedTrustAIDemo() {
  const [view, setView] = useState<'access' | 'patient'>('access');

  // Access Form State
  const [role, setRole] = useState(ROLES[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [time, setTime] = useState<'Daytime' | 'Nighttime'>('Daytime');
  const [purpose, setPurpose] = useState('Patient_A_Record');
  const [emergency, setEmergency] = useState(false);
  const [justification, setJustification] = useState('');

  // Decision Display State
  const [decision, setDecision] = useState<AccessDecision>('PENDING');
  const [auditLogMessage, setAuditLogMessage] = useState<string>('');
  
  // Patient View State
  const [patientLogs, setPatientLogs] = useState<AuditLogEntry[]>([]);

  // Function to handle the form submission and API call
  const checkAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecision('PENDING');
    setAuditLogMessage('Evaluating access request...');

    const contextData = {
      role,
      location: location.split(' ')[0], // Send only 'Internal_IP'
      time,
      purpose,
      emergency,
      justification: emergency ? justification : '',
    };

    try {
      const response = await axios.post(BACKEND_URL, contextData);
      const result = response.data;
      
      setDecision(result.decision as AccessDecision);
      setAuditLogMessage(result.log);
      
    } catch (error) {
      setDecision('DENY');
      setAuditLogMessage('Error: Could not connect to the Backend Decision Engine.');
      console.error('Access Check API Error:', error);
    }
  };

  // Function to fetch the mock audit logs for the patient view
  const fetchPatientLogs = useCallback(async () => {
    try {
      const response = await axios.get(AUDIT_URL);
      setPatientLogs(response.data);
    } catch (error) {
      console.error('Patient Log API Error:', error);
      setPatientLogs([{
          who: 'System', role: 'N/A', action: 'Attempted', resource: 'N/A', 
          timestamp: new Date().toLocaleTimeString(), context: 'N/A', 
          decision_reason: 'Error fetching logs from backend.' 
      } as AuditLogEntry]);
    }
  }, []);

  // --- 4. Decision Panel Component ---
  const DecisionPanel = () => {
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-800';
    let decisionText = 'Pending Check';

    if (decision === 'ALLOW') {
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      decisionText = 'ACCESS GRANTED (LOW RISK)';
    } else if (decision === 'RESTRICT') {
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
      decisionText = 'ACCESS RESTRICTED (MEDIUM RISK)';
    } else if (decision === 'DENY') {
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      decisionText = 'ACCESS DENIED (HIGH RISK)';
    }

    return (
      <div className={`p-6 rounded-xl shadow-lg mt-6 ${bgColor}`}>
        <h2 className={`text-2xl font-bold ${textColor} mb-2`}>
          Dynamic Decision: {decisionText}
        </h2>
        <p className="text-gray-600 font-medium">Audit Log Message:</p>
        <p className="text-gray-900 italic">{auditLogMessage}</p>
      </div>
    );
  };

  // --- 5. Access Request View (Main Demo Screen) ---
  const AccessRequestView = () => (
    <>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">1. Context-Aware Access Request</h2>
      <form onSubmit={checkAccess} className="space-y-4">
        {/* WHO Input */}
        <label className="block">
          <span className="text-gray-700 font-medium">WHO: User Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        {/* WHERE Input */}
        <label className="block">
          <span className="text-gray-700 font-medium">WHERE: Location/IP</span>
          <select value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>

        {/* WHEN Input */}
        <label className="block">
          <span className="text-gray-700 font-medium">WHEN: Time of Day</span>
          <select value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
            <option value="Daytime">Daytime (8am-5pm)</option>
            <option value="Nighttime">Nighttime (After Hours)</option>
          </select>
        </label>

        {/* WHY Input */}
        <label className="block">
          <span className="text-gray-700 font-medium">WHY: Resource/Purpose</span>
          <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" placeholder="e.g., Patient_A_Record" />
        </label>

        {/* EMERGENCY Override */}
        <div className="flex items-center space-x-3">
          <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} className="h-5 w-5 text-indigo-600 rounded" />
          <label className="text-lg font-bold text-red-600">
            Emergency Access (Break-Glass)
          </label>
        </div>

        {/* Justification Input */}
        {emergency && (
          <label className="block">
            <span className="text-gray-700 font-medium">Justification (for NLP Review)</span>
            <input type="text" value={justification} onChange={(e) => setJustification(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" placeholder="e.g., Critical surgery needed now" required />
          </label>
        )}

        {/* Submission Button */}
        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition duration-150">
          Check Access & Compute Trust Score
        </button>
      </form>

      {/* Decision Display */}
      <DecisionPanel />
    </>
  );

  // --- 6. Patient Transparency View ---
  const PatientView = () => (
    <>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">3. Patient Transparency Dashboard (Who Viewed My Data?)</h2>
      <p className="mb-4 text-gray-600">This view shows Patient A's audit history, ensuring full data accountability.</p>
      
      <button onClick={fetchPatientLogs} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-150 mb-6">
          Refresh Access Logs
      </button>

      <div className="space-y-4">
        {patientLogs.length > 0 ? (
            patientLogs.map((log, index) => (
                <div key={index} className={`p-4 rounded-lg shadow ${log.action === 'Attempted' ? 'bg-red-50' : 'bg-green-50'}`}>
                    <p className="font-bold text-lg">{log.who} ({log.role})</p>
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">Action:</span> {log.action} | 
                        <span className="font-medium ml-3">Time:</span> {log.timestamp} | 
                        <span className="font-medium ml-3">Resource:</span> {log.resource}
                    </p>
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">Decision Context:</span> {log.decision_reason}
                    </p>
                </div>
            ))
        ) : (
            <p className="text-gray-500">No access logs to display. Click "Refresh Access Logs".</p>
        )}
      </div>
    </>
  );

  // --- 7. Layout & View Switching ---
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-indigo-700">
          🏆 MedTrust AI
        </h1>
        <p className="text-xl text-gray-600 mt-2">Adaptive Trust-Based EHR Access System (Hackathon MVP)</p>
        <div className="flex justify-center space-x-4 mt-6">
            <button 
                onClick={() => setView('access')} 
                className={`px-4 py-2 rounded-lg font-medium transition ${view === 'access' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
                ⚕️ Doctor/Nurse Access Check
            </button>
            <button 
                onClick={() => {setView('patient'); fetchPatientLogs();}} 
                className={`px-4 py-2 rounded-lg font-medium transition ${view === 'patient' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
                👤 Patient Transparency Dashboard
            </button>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-2xl">
        {view === 'access' ? <AccessRequestView /> : <PatientView />}
      </main>
    </div>
  );
}