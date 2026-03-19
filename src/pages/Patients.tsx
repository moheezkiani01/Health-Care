import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { clsx } from 'clsx';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2,
  Edit2,
  UserPlus,
  Filter,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  MapPin,
  Shield,
  FileText,
  X,
  ClipboardCheck,
  Stethoscope,
  Pill,
  Activity,
  FileSignature,
  UserMinus,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '../components/Button';
import { Link, useSearchParams } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { Notification, NotificationType } from '../components/Notification';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const patientSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  dob: z.string().min(1, 'Required'),
  gender: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  street: z.string().optional(),
  apt: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  insurance_id: z.string().optional(),
  ssn_encrypted: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  mloa_days: z.number().min(0).max(365).optional(),
  nmloa_days: z.number().min(0).max(365).optional(),
  last_annual_physical: z.string().optional().or(z.literal('')),
  last_semi_annual_report: z.string().optional().or(z.literal('')),
  last_monthly_visit: z.string().optional().or(z.literal('')),
  preferred_name: z.string().optional(),
  race: z.string().optional(),
  religion: z.string().optional(),
  marital_status: z.string().optional(),
  primary_language: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  is_responsible_for_self: z.boolean().optional(),
  mds_date: z.string().optional().or(z.literal('')),
  hospital_of_choice: z.string().optional(),
  start_of_service: z.string().optional().or(z.literal('')),
  occupation: z.string().optional(),
  mothers_maiden_name: z.string().optional(),
  primary_payer: z.string().optional(),
  medicare_id: z.string().optional(),
  medicaid_id: z.string().optional(),
  other_insurance: z.string().optional(),
  other_insurance_id: z.string().optional(),
  living_will: z.string().optional(),
  full_code: z.string().optional(),
  organ_donation: z.string().optional(),
  autopsy_request: z.string().optional(),
  hospice: z.string().optional(),
  dnr: z.string().optional(),
  dni: z.string().optional(),
  dnh: z.string().optional(),
  feeding_restrictions: z.string().optional(),
  medication_restrictions: z.string().optional(),
  other_treatment_restrictions: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  emergency_contact_address: z.object({
    street: z.string().optional(),
    apt: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
  }).optional(),
  pcp_id: z.string().optional(),
  other_provider_ids: z.string().optional(),
  diagnoses: z.array(z.object({
    disease: z.string().min(1, 'Required'),
    icd10: z.string().min(1, 'Required'),
  })).optional(),
  medications: z.array(z.object({
    medicine: z.string().min(1, 'Required'),
    dosage: z.string().min(1, 'Required'),
    schedule: z.string().min(1, 'Required'),
  })).optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  phone: string | null;
  email: string | null;
  street: string | null;
  apt: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  insurance_id: string | null;
  ssn_encrypted: string | null;
  status: 'active' | 'inactive';
  mloa_days: number;
  nmloa_days: number;
  last_annual_physical: string | null;
  last_semi_annual_report: string | null;
  last_monthly_visit: string | null;
  preferred_name: string | null;
  race: string | null;
  religion: string | null;
  marital_status: string | null;
  primary_language: string | null;
  height: string | null;
  weight: string | null;
  is_responsible_for_self: boolean;
  mds_date: string | null;
  hospital_of_choice: string | null;
  start_of_service: string | null;
  occupation: string | null;
  mothers_maiden_name: string | null;
  primary_payer: string | null;
  medicare_id: string | null;
  medicaid_id: string | null;
  other_insurance: string | null;
  other_insurance_id: string | null;
  living_will: string | null;
  full_code: string | null;
  organ_donation: string | null;
  autopsy_request: string | null;
  hospice: string | null;
  dnr: string | null;
  dni: string | null;
  dnh: string | null;
  feeding_restrictions: string | null;
  medication_restrictions: string | null;
  other_treatment_restrictions: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_address: {
    street?: string;
    apt?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  pcp_id: string | null;
  other_provider_ids: string | null;
  diagnoses: {
    disease: string;
    icd10: string;
  }[] | null;
  medications: {
    medicine: string;
    dosage: string;
    schedule: string;
  }[] | null;
  created_at: string;
  last_visit?: string;
}

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [medicalProviders, setMedicalProviders] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const editFromUrlHandled = useRef(false);

  // Open edit modal if ?edit=<id> is in the URL (from PatientProfile "Edit Profile").
  // Ref prevents re-firing every time patients state updates (e.g. after save).
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || patients.length === 0 || editFromUrlHandled.current) return;
    const patient = patients.find(p => p.id === editId);
    if (patient) {
      editFromUrlHandled.current = true;
      openEditModal(patient);
    }
  }, [searchParams, patients]);

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors, isSubmitting } } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      mloa_days: 0,
      nmloa_days: 0,
      status: 'active',
      emergency_contact_address: { street: '', apt: '', city: '', state: '', zip: '' },
      diagnoses: [],
      medications: []
    }
  });

  const { fields: diagnosisFields, append: appendDiagnosis, remove: removeDiagnosis } = useFieldArray({
    control,
    name: "diagnoses"
  });

  const { fields: medicationFields, append: appendMedication, remove: removeMedication } = useFieldArray({
    control,
    name: "medications"
  });

  const dob = watch('dob');
  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setValue('first_name', patient.first_name);
    setValue('last_name', patient.last_name);
    setValue('dob', patient.dob);
    setValue('gender', patient.gender);
    setValue('phone', patient.phone || '');
    setValue('email', patient.email || '');
    setValue('street', patient.street || '');
    setValue('apt', patient.apt || '');
    setValue('city', patient.city || '');
    setValue('state', patient.state || '');
    setValue('zip', patient.zip || '');
    setValue('insurance_id', patient.insurance_id || '');
    setValue('ssn_encrypted', patient.ssn_encrypted || '');
    setValue('status', patient.status);
    setValue('mloa_days', patient.mloa_days || 0);
    setValue('nmloa_days', patient.nmloa_days || 0);
    setValue('last_annual_physical', patient.last_annual_physical || '');
    setValue('last_semi_annual_report', patient.last_semi_annual_report || '');
    setValue('last_monthly_visit', patient.last_monthly_visit || '');
    setValue('preferred_name', patient.preferred_name || '');
    setValue('race', patient.race || '');
    setValue('religion', patient.religion || '');
    setValue('marital_status', patient.marital_status || '');
    setValue('primary_language', patient.primary_language || '');
    setValue('height', patient.height || '');
    setValue('weight', patient.weight || '');
    setValue('is_responsible_for_self', patient.is_responsible_for_self ?? true);
    setValue('mds_date', patient.mds_date || '');
    setValue('hospital_of_choice', patient.hospital_of_choice || '');
    setValue('start_of_service', patient.start_of_service || '');
    setValue('occupation', patient.occupation || '');
    setValue('mothers_maiden_name', patient.mothers_maiden_name || '');
    setValue('primary_payer', patient.primary_payer || '');
    setValue('medicare_id', patient.medicare_id || '');
    setValue('medicaid_id', patient.medicaid_id || '');
    setValue('other_insurance', patient.other_insurance || '');
    setValue('other_insurance_id', patient.other_insurance_id || '');
    setValue('living_will', patient.living_will || 'No');
    setValue('full_code', patient.full_code || 'No');
    setValue('organ_donation', patient.organ_donation || 'No');
    setValue('autopsy_request', patient.autopsy_request || 'No');
    setValue('hospice', patient.hospice || 'No');
    setValue('dnr', patient.dnr || 'No');
    setValue('dni', patient.dni || 'No');
    setValue('dnh', patient.dnh || 'No');
    setValue('feeding_restrictions', patient.feeding_restrictions || 'No');
    setValue('medication_restrictions', patient.medication_restrictions || 'No');
    setValue('other_treatment_restrictions', patient.other_treatment_restrictions || 'No');
    setValue('emergency_contact_name', patient.emergency_contact_name || '');
    setValue('emergency_contact_phone', patient.emergency_contact_phone || '');
    setValue('emergency_contact_relationship', patient.emergency_contact_relationship || '');
    setValue('emergency_contact_address', patient.emergency_contact_address || { street: '', apt: '', city: '', state: '', zip: '' });
    setValue('pcp_id', patient.pcp_id || '');
    setValue('other_provider_ids', patient.other_provider_ids || '');
    setValue('diagnoses', patient.diagnoses || []);
    setValue('medications', patient.medications || []);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchPatients();
    fetchMedicalProviders();
  }, []);

  const fetchMedicalProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_providers')
        .select('*')
        .order('last_name', { ascending: true });
      if (error) throw error;
      setMedicalProviders(data || []);
    } catch (error) {
      console.error('Error fetching medical providers:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('last_name', { ascending: true });

      if (patientsError) throw patientsError;

      // Fetch last visits for all patients
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('patient_id, scheduled_at')
        .eq('status', 'Verified')
        .order('scheduled_at', { ascending: false });

      if (visitsError) {
        console.warn('Error fetching visits:', visitsError);
      }

      // Map last visits to patients
      const patientsWithVisits = (patientsData || []).map(patient => {
        const lastVisit = visitsData?.find(v => v.patient_id === patient.id);
        return {
          ...patient,
          last_visit: lastVisit?.scheduled_at
        };
      });

      setPatients(patientsWithVisits);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.warn('Patients: Form validation errors:', errors);
    }
  }, [errors]);

  const onSubmit = async (data: PatientFormValues) => {
    console.log('Patients: Submitting form data:', data);
    try {
      const patientData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        dob: data.dob,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        street: data.street,
        apt: data.apt,
        city: data.city,
        state: data.state,
        zip: data.zip,
        insurance_id: data.insurance_id,
        ssn_encrypted: data.ssn_encrypted,
        status: data.status || 'active',
        mloa_days: data.mloa_days,
        nmloa_days: data.nmloa_days,
        last_annual_physical: data.last_annual_physical || null,
        last_semi_annual_report: data.last_semi_annual_report || null,
        last_monthly_visit: data.last_monthly_visit || null,
        preferred_name: data.preferred_name || null,
        race: data.race || null,
        religion: data.religion || null,
        marital_status: data.marital_status || null,
        primary_language: data.primary_language || null,
        height: data.height || null,
        weight: data.weight || null,
        is_responsible_for_self: data.is_responsible_for_self,
        mds_date: data.mds_date || null,
        hospital_of_choice: data.hospital_of_choice || null,
        start_of_service: data.start_of_service || null,
        occupation: data.occupation || null,
        mothers_maiden_name: data.mothers_maiden_name || null,
        primary_payer: data.primary_payer || null,
        medicare_id: data.medicare_id || null,
        medicaid_id: data.medicaid_id || null,
        other_insurance: data.other_insurance || null,
        other_insurance_id: data.other_insurance_id || null,
        living_will: data.living_will || null,
        full_code: data.full_code || null,
        organ_donation: data.organ_donation || null,
        autopsy_request: data.autopsy_request || null,
        hospice: data.hospice || null,
        dnr: data.dnr || null,
        dni: data.dni || null,
        dnh: data.dnh || null,
        feeding_restrictions: data.feeding_restrictions || null,
        medication_restrictions: data.medication_restrictions || null,
        other_treatment_restrictions: data.other_treatment_restrictions || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relationship: data.emergency_contact_relationship || null,
        emergency_contact_address: data.emergency_contact_address || null,
        pcp_id: data.pcp_id || null,
        other_provider_ids: data.other_provider_ids || null,
        diagnoses: data.diagnoses || [],
        medications: data.medications || []
      };

      if (editingPatient) {
        const response = await fetch('/api/patients/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPatient.id, ...patientData })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to update patient');
        
        setNotification({ type: 'success', message: 'Patient record updated successfully!' });
      } else {
        const response = await fetch('/api/patients/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientData)
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to create patient');
        
        setNotification({ type: 'success', message: 'New patient record added successfully!' });
      }

      setIsModalOpen(false);
      setEditingPatient(null);
      reset();
      await fetchPatients();
    } catch (error: any) {
      console.error('Error saving patient:', error);
      setNotification({ type: 'error', message: 'Error saving patient: ' + (error.message || 'Check console for details') });
    }
  };

  const handleDelete = async () => {
    if (!patientToDelete) return;

    try {
      const response = await fetch('/api/patients/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: patientToDelete })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete patient');
      
      // Refresh data from server to ensure sync
      await fetchPatients();
      setNotification({ type: 'success', message: 'Patient record and all related data deleted successfully.' });
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      setNotification({ type: 'error', message: 'Error deleting patient: ' + (error.message || 'Check console for details') });
    } finally {
      setPatientToDelete(null);
    }
  };

  const filteredPatients = patients.filter(p => 
    (filterStatus === 'All' || p.status === filterStatus.toLowerCase()) &&
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const FormsDropdown = ({ patientId }: { patientId: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
    const containerRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // If less than 350px below and more space above, show on top
        if (spaceBelow < 350 && spaceAbove > spaceBelow) {
          setPosition('top');
        } else {
          setPosition('bottom');
        }
      }
    };

    useEffect(() => {
      if (isOpen) {
        updatePosition();
      }
    }, [isOpen]);

    return (
      <div 
        ref={containerRef}
        className="relative inline-block"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <Button variant="ghost" size="sm" className="rounded-full text-xs flex items-center gap-1">
          Forms
          <ChevronDown size={14} />
        </Button>
        <div 
          className={clsx(
            "absolute left-1/2 -translate-x-1/2 w-64 bg-white rounded-2xl border border-zinc-200 shadow-2xl z-50 overflow-hidden transition-all duration-200",
            isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none",
            position === 'bottom' ? "top-full mt-2" : "bottom-full mb-2"
          )}
        >
          <div className="p-2 grid grid-cols-1 gap-1 max-h-80 overflow-y-auto">
            <Link to={`/progress-note?patientId=${patientId}`} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors">
              <FileText size={14} className="text-emerald-500" />
              Progress Note
            </Link>
            <Link to={`/care-plan?patientId=${patientId}`} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors">
              <FileText size={14} className="text-blue-500" />
              Care Plan
            </Link>
            <Link to={`/mds-assessment?patientId=${patientId}`} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors">
              <ClipboardCheck size={14} className="text-cyan-500" />
              MDS Assessment
            </Link>
            <Link to={`/nursing-assessment?patientId=${patientId}`} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors">
              <Stethoscope size={14} className="text-orange-500" />
              Nursing Assessment
            </Link>
            <Link to={`/mar?patientId=${patientId}`} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors">
              <Pill size={14} className="text-pink-500" />
              MAR
            </Link>
            <Link to={`/tar?patientId=${patientId}`} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors">
              <Activity size={14} className="text-indigo-500" />
              TAR
            </Link>
            <Link to={`/physician-summary?patientId=${patientId}`} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors">
              <FileText size={14} className="text-amber-500" />
              Physician Summary
            </Link>
            <Link to={`/physician-orders?patientId=${patientId}`} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors">
              <FileSignature size={14} className="text-purple-500" />
              Physician Orders
            </Link>
            <Link to={`/admission-assessment?patientId=${patientId}`} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors">
              <UserPlus size={14} className="text-emerald-500" />
              Admission Assessment
            </Link>
            <Link to={`/discharge-summary?patientId=${patientId}`} className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors">
              <UserMinus size={14} className="text-rose-500" />
              Discharge Summary
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 italic">Patients</h1>
          <p className="text-sm md:text-base text-zinc-500">Manage participant records and clinical history</p>
        </div>
        <Button className="rounded-full px-6 w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all shadow-sm"
          />
        </div>
        <div className="relative w-full md:w-auto">
          <Button 
            variant="secondary" 
            className="rounded-2xl h-[50px] w-full md:w-auto"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {filterStatus === 'All' ? 'Filter' : filterStatus}
          </Button>
          
          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-zinc-200 shadow-xl z-50 overflow-hidden">
              {['All', 'Active', 'Inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 transition-colors ${filterStatus === status ? 'text-partners-blue-dark font-bold bg-partners-blue-dark/5' : 'text-zinc-600'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-3xl border border-zinc-200 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-bottom border-zinc-200">
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">DOB</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Last Visit</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-24"></div></td>
                  <td className="px-6 py-4"></td>
                </tr>
              ))
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  No patients found matching your search.
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center font-bold">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{patient.last_name}, {patient.first_name}</p>
                        <p className="text-xs text-zinc-500">ID: {patient.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-mono text-sm">
                    {new Date(patient.dob).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-sm">
                    {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : '--'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(patient)}
                        className="p-2 text-zinc-400 hover:text-partners-blue-dark hover:bg-partners-blue-dark/5 rounded-xl transition-colors"
                        title="Edit Patient"
                      >
                        <Edit2 size={16} />
                      </button>
                      <Link to={`/patient-profile/${patient.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-full text-xs">
                          Profile
                        </Button>
                      </Link>
                      
                      <FormsDropdown patientId={patient.id} />

                      <button 
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        onClick={() => setPatientToDelete(patient.id)}
                        title="Delete Patient"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-3xl border border-zinc-200 animate-pulse"></div>
          ))
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center text-zinc-500">
            No patients found.
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center font-bold">
                    {patient.first_name[0]}{patient.last_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{patient.last_name}, {patient.first_name}</p>
                    <p className="text-xs text-zinc-500">ID: {patient.id.slice(0, 8)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {patient.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-zinc-400 font-bold uppercase">DOB</p>
                  <p className="text-zinc-600">{new Date(patient.dob).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-bold uppercase">Last Visit</p>
                  <p className="text-zinc-600">{patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : '--'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Link to={`/patient-profile/${patient.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    Profile
                  </Button>
                </Link>
                
                <FormsDropdown patientId={patient.id} />

                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-none text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl px-3"
                  onClick={() => setPatientToDelete(patient.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatient ? "Edit Patient" : "Add New Patient"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* DEMOGRAPHICS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider border-b-2 border-partners-blue-dark/20 pb-2">Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">First Name</label>
                <input
                  {...register('first_name')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="First Name"
                />
                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Last Name</label>
                <input
                  {...register('last_name')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Last Name"
                />
                {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Email</label>
                <input
                  {...register('email')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Email Address"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Preferred Name</label>
                <input
                  {...register('preferred_name')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Preferred Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Race</label>
                <input
                  {...register('race')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Race"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Sex</label>
                <select
                  {...register('gender')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                >
                  <option value="">Select Sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Religion</label>
                <input
                  {...register('religion')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Religion"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Date of Birth</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="date"
                    {...register('dob')}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  />
                </div>
                {errors.dob && <p className="text-xs text-red-500">{errors.dob.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Martial Status</label>
                <select
                  {...register('marital_status')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Patient Status</label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Age</label>
                <input
                  type="text"
                  readOnly
                  value={calculateAge(dob)}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 outline-none"
                  placeholder="Auto from DOB"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Primary Language</label>
                <input
                  {...register('primary_language')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Primary Language"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Height</label>
                  <input
                    {...register('height')}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                    placeholder="e.g. 5ft 10in"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Weight</label>
                  <input
                    {...register('weight')}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                    placeholder="e.g. 160 lbs"
                  />
                </div>
              </div>
              <div className="space-y-2 flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  {...register('is_responsible_for_self')}
                  className="w-4 h-4 rounded border-zinc-300 text-partners-blue-dark focus:ring-partners-blue-dark"
                />
                <label className="text-sm font-medium text-zinc-700">Is Responsible for Self</label>
              </div>
            </div>
          </div>

          {/* CENSUS SUMMARY */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider border-b-2 border-partners-blue-dark/20 pb-2">Census Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">MDS Date</label>
                <input
                  type="date"
                  {...register('mds_date')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Hospital of Choice</label>
                <input
                  {...register('hospital_of_choice')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Hospital Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Start of Service</label>
                <input
                  type="date"
                  {...register('start_of_service')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">MLOA Days</label>
                <input
                  type="number"
                  {...register('mloa_days', { valueAsNumber: true })}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">NMLOA Days</label>
                <input
                  type="number"
                  {...register('nmloa_days', { valueAsNumber: true })}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Last Annual Physical</label>
                <input
                  type="date"
                  {...register('last_annual_physical')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Last Semi-Annual Report</label>
                <input
                  type="date"
                  {...register('last_semi_annual_report')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Last Monthly Visit</label>
                <input
                  type="date"
                  {...register('last_monthly_visit')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider border-b-2 border-partners-blue-dark/20 pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-700">Address (Street)</label>
                <input
                  {...register('street')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Street Address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Apt</label>
                <input
                  {...register('apt')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Apt #"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">City</label>
                <input
                  {...register('city')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">State</label>
                <input
                  {...register('state')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Zip</label>
                <input
                  {...register('zip')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Zip Code"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Telephone</label>
                <input
                  {...register('phone')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Telephone"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Occupation</label>
                <input
                  {...register('occupation')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Occupation"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Mothers Maiden Name</label>
                <input
                  {...register('mothers_maiden_name')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Mothers Maiden Name"
                />
              </div>
            </div>
          </div>

          {/* PAYER INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider border-b-2 border-partners-blue-dark/20 pb-2">Payer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Primary Payer</label>
                <input
                  {...register('primary_payer')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Primary Payer Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">SSN</label>
                <input
                  {...register('ssn_encrypted')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="SSN"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Medical Record #</label>
                <input
                  {...register('insurance_id')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Medical Record #"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Medicare ID#</label>
                <input
                  {...register('medicare_id')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Medicare ID#"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Medicaid ID#</label>
                <input
                  {...register('medicaid_id')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Medicaid ID#"
                />
              </div>
            </div>
          </div>

          {/* OTHER INSURANCE INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider border-b-2 border-partners-blue-dark/20 pb-2">Other Insurance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Insurance</label>
                <input
                  {...register('other_insurance')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Insurance Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">ID Number</label>
                <input
                  {...register('other_insurance_id')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="ID Number"
                />
              </div>
            </div>
          </div>

          {/* ADVANCED DIRECTIVES */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider border-b-2 border-partners-blue-dark/20 pb-2">Advanced Directives</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'living_will', label: 'Living Will' },
                { name: 'dnr', label: 'DNR' },
                { name: 'full_code', label: 'Full Code' },
                { name: 'dni', label: 'DNI' },
                { name: 'organ_donation', label: 'Organ Donation' },
                { name: 'dnh', label: 'DNH' },
                { name: 'autopsy_request', label: 'Autopsy Request' },
                { name: 'feeding_restrictions', label: 'Feeding Restrictions' },
                { name: 'hospice', label: 'Hospice' },
                { name: 'medication_restrictions', label: 'Medication Restrictions' },
                { name: 'other_treatment_restrictions', label: 'Other Treatment Restrictions' }
              ].map(field => (
                <div key={field.name} className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">{field.label}</label>
                  <select
                    {...register(field.name as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-partners-blue-dark outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* PRIMARY CARE PHYSICIAN */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider border-b-2 border-partners-blue-dark/20 pb-2">Primary Care Physician</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Select PCP</label>
              <select
                {...register('pcp_id')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
              >
                <option value="">Select a Provider</option>
                {medicalProviders.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.last_name}, {provider.first_name} - {provider.facility_name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-400 italic">Define this in medical-providers and attach to patient</p>
            </div>
          </div>

          {/* OTHER PROVIDER(S) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider border-b-2 border-partners-blue-dark/20 pb-2">Other Provider(s)</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Enter Other Providers (Optional)</label>
              <textarea
                {...register('other_provider_ids')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all min-h-[100px]"
                placeholder="Enter other provider names or IDs..."
              />
              <p className="text-[10px] text-zinc-400 italic">You can enter multiple providers here.</p>
            </div>
          </div>

          {/* CURRENT DIAGNOSIS */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b-2 border-partners-blue-dark/20 pb-2">
              <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider">Current Diagnosis</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => appendDiagnosis({ disease: '', icd10: '' })}>
                <Plus size={16} className="mr-1" /> Add Diagnosis
              </Button>
            </div>
            <div className="space-y-4">
              {diagnosisFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-zinc-50 p-4 rounded-2xl relative">
                  <button
                    type="button"
                    onClick={() => removeDiagnosis(index)}
                    className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-700 uppercase">Disease</label>
                    <input
                      {...register(`diagnoses.${index}.disease` as const)}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none bg-white"
                      placeholder="Disease Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-700 uppercase">ICD-10 Code</label>
                    <input
                      {...register(`diagnoses.${index}.icd10` as const)}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none bg-white"
                      placeholder="ICD-10 Code"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EMERGENCY CONTACT */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider border-b-2 border-partners-blue-dark/20 pb-2">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Name</label>
                <input
                  {...register('emergency_contact_name')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Contact Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Phone</label>
                <input
                  {...register('emergency_contact_phone')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Phone"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Relationship</label>
                <input
                  {...register('emergency_contact_relationship')}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="Relationship"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-zinc-700">Address (Street)</label>
                  <input
                    {...register('emergency_contact_address.street')}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                    placeholder="Street"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Apt</label>
                  <input
                    {...register('emergency_contact_address.apt')}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                    placeholder="Apt"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">City</label>
                  <input
                    {...register('emergency_contact_address.city')}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">State</label>
                  <input
                    {...register('emergency_contact_address.state')}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Zip</label>
                  <input
                    {...register('emergency_contact_address.zip')}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                    placeholder="Zip"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MEDICATIONS */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b-2 border-partners-blue-dark/20 pb-2">
              <h3 className="text-sm font-bold text-partners-blue-dark uppercase tracking-wider">Medications</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => appendMedication({ medicine: '', dosage: '', schedule: 'once a day' })}>
                <Plus size={16} className="mr-1" /> Add Medication
              </Button>
            </div>
            <div className="space-y-4">
              {medicationFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-zinc-50 p-4 rounded-2xl relative">
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-700 uppercase">Medicine</label>
                    <input
                      {...register(`medications.${index}.medicine` as const)}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none bg-white"
                      placeholder="Medicine Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-700 uppercase">Dosage</label>
                    <input
                      {...register(`medications.${index}.dosage` as const)}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none bg-white"
                      placeholder="Dosage"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-700 uppercase">Schedule</label>
                    <select
                      {...register(`medications.${index}.schedule` as const)}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none bg-white"
                    >
                      <option value="once a day">Once a day</option>
                      <option value="twice a day">Twice a day</option>
                      <option value="three times a day">Three times a day</option>
                      <option value="four times a day">Four times a day</option>
                      <option value="as needed">As needed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingPatient ? 'Update Patient' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-red-900">Are you sure?</p>
              <p className="text-xs text-red-700">This action cannot be undone and will permanently delete the patient record.</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPatientToDelete(null)}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notification Toast */}
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};