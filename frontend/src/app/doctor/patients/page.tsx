'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type MedicalHistory = {
  diagnosis: string;
  prescriptions: string[];
  visitDate: string;
};

type Patient = {
  _id: string;
  name: string;
  age: number;
  gender: string;
  medicalHistory: MedicalHistory[];
};

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
      setLoading(false);
    };
    fetchPatients();
  }, []);

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main>
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Patients & Medical History</h1>
      <Input
        placeholder="Search patient by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs mb-4"
      />
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          {loading ? (
            <div>Loading...</div>
          ) : filtered.length === 0 ? (
            <div>No patients found.</div>
          ) : (
            filtered.map((patient) => (
              <Card
                key={patient._id}
                className={`mb-2 cursor-pointer ${selected?._id === patient._id ? 'border-primary' : ''}`}
                onClick={() => setSelected(patient)}
              >
                <CardHeader>
                  <CardTitle>{patient.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>Age: {patient.age}</div>
                  <div>Gender: {patient.gender}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <div>
          {selected ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selected.name} — Medical History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selected.medicalHistory.length === 0 ? (
                  <div>No medical history found.</div>
                ) : (
                  <ul className="space-y-4">
                    {selected.medicalHistory.map((mh, idx) => (
                      <li key={idx} className="border-b pb-2">
                        <div><b>Date:</b> {mh.visitDate}</div>
                        <div><b>Diagnosis:</b> {mh.diagnosis}</div>
                        <div>
                          <b>Prescriptions:</b>
                          <ul className="list-disc ml-6">
                            {mh.prescriptions.map((pres, i) => (
                              <li key={i}>{pres}</li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : (
            <div>Select a patient to view medical history.</div>
          )}
        </div>
      </div>
    </div>
    </main>
  );
}
