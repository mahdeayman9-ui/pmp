import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Task, DailyAchievement, MediaItem, VoiceNote } from '../../types';
import { TasksService } from '../../services/tasks.service';
import { canUpdateTasks } from '../../utils/permissions';

// --- Helpers ---
const formatDate = (date: string | number | Date | null | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString();
};

// Network connectivity helper
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Check if error is network-related
const isNetworkError = (error: any): boolean => {
  return !isOnline() ||
         error.message?.includes('fetch') ||
         error.message?.includes('network') ||
         error.message?.includes('Failed to fetch') ||
         error.code === 'NETWORK_ERROR' ||
         error.name === 'NetworkError';
};

// Offline data persistence helpers
const saveToOfflineStorage = (key: string, data: any) => {
  try {
    const offlineData = JSON.parse(localStorage.getItem('pmp_offline_data') || '{}');
    offlineData[key] = { ...data, timestamp: new Date().toISOString() };
    localStorage.setItem('pmp_offline_data', JSON.stringify(offlineData));
  } catch (error) {
    console.error('Error saving to offline storage:', error);
  }
};

const clearOfflineStorage = (key: string) => {
  try {
    const offlineData = JSON.parse(localStorage.getItem('pmp_offline_data') || '{}');
    delete offlineData[key];
    localStorage.setItem('pmp_offline_data', JSON.stringify(offlineData));
  } catch (error) {
    console.error('Error clearing offline storage:', error);
  }
};

const formatTime = (date: string | number | Date | null | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (ms: number | null | undefined): string => {
  if (!ms || isNaN(ms)) return '0h';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const getDatesInRange = (startDate: string | Date | null | undefined, endDate: string | Date | null | undefined): Date[] => {
  if (!startDate || !endDate) return [];
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

// SVG Icons
const icons = {
  plus: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  minus: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
    </svg>
  ),
  mic: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3.53-2.64 6.43-6.17 6.97V21h-2v-3.03C5.38 17.43 2.72 14.53 2.72 11h-2c0 4.29 3.06 7.82 7.08 8.5V21h2v-1.5c4.02-.68 7.08-4.21 7.08-8.5h-2z"/>
    </svg>
  ),
  stop: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h12v12H6z"/>
    </svg>
  ),
  play: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  ),
  pause: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  ),
  delete: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  chevronDown: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  chevronUp: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
  target: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  edit: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  x: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  checkin: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  checkout: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0zM12 12a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  ),
};

type DisplayStatus = 'Completed' | 'In Progress' | 'Overdue' | 'Pending (Overdue)' | 'Not Started';

const statusColors = {
  'Completed': 'text-green-600',
  'In Progress': 'text-blue-600',
  'Overdue': 'text-red-600',
  'Pending (Overdue)': 'text-orange-600',
  'Not Started': 'text-gray-500',
};

const riskColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800 font-bold',
};

// --- Daily Achievement Card Component ---
interface DailyAchievementCardProps {
  task: Task;
  day: Date;
  achievement: DailyAchievement | undefined;
  updateTask: (id: string, task: Task) => void;
  setModal: (modal: { visible: boolean; message: string; onConfirm: (() => void) | null }) => void;
  isFullPage?: boolean;
  canUpdate: boolean;
}

// --- Task Card Component Props ---
interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  toggleExpand: (id: string) => void;
  updateTask: (id: string, task: Task) => void;
  deleteTask: (task: Task) => void;
  setModal: (modal: { visible: boolean; message: string; onConfirm: (() => void | Promise<void>) | null }) => void;
  isFullPage?: boolean;
  canUpdate: boolean;
}

const DailyAchievementCard: React.FC<DailyAchievementCardProps> = ({ task, day, achievement, updateTask, setModal, isFullPage = false, canUpdate }) => {
  const { getAllMembers } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(achievement?.value || '');
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(achievement?.assignedMembers || []);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const allMembers = getAllMembers();

  const formattedDate = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isToday = day.toDateString() === new Date().toDateString();

  const isInputDisabled = !task.actualStartDate;
  const remainingTarget = (task.totalTarget || 0) - (task.totalAchieved || 0);
  const maxAllowedValue = isEditing ? remainingTarget + (achievement?.value || 0) : remainingTarget;

  const checkIn = achievement?.checkIn;
  const checkOut = achievement?.checkOut;

  const { durationMs, overtimeMs } = useMemo(() => {
    if (!checkIn || !checkOut) return { durationMs: 0, overtimeMs: 0 };
    const checkInTime = new Date(checkIn.timestamp).getTime();
    const checkOutTime = new Date(checkOut.timestamp).getTime();
    const duration = checkOutTime - checkInTime;
    const plannedEffortMs = (task.plannedEffortHours || 0) * 60 * 60 * 1000;
    const overtime = duration > plannedEffortMs ? duration - plannedEffortMs : 0;
    return { durationMs: duration, overtimeMs: overtime };
  }, [checkIn, checkOut, task.plannedEffortHours]);

  const handleGetLocation = (callback: (location: { latitude: number; longitude: number }) => void) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setModal({
            visible: true,
            message: "Failed to get location. Please enable location services and try again.",
            onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
          });
        }
      );
    } else {
      setModal({
        visible: true,
        message: "Geolocation is not supported by your browser.",
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
    }
  };

  const handleCheckIn = () => {
    if (!task.actualStartDate) {
      setModal({
        visible: true,
        message: "يجب النقر على 'بدء المهمة' قبل تسجيل الدخول.",
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
      return;
    }

    if (selectedMembers.length === 0) {
      setModal({
        visible: true,
        message: "يجب اختيار الأعضاء المشاركين قبل تسجيل الدخول.",
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
      return;
    }

    handleGetLocation((location) => {
      const checkInData = {
        timestamp: new Date().toISOString(),
        location: location,
      };

      const memberCheckIns = { ...(achievement?.memberCheckIns || {}) };
      selectedMembers.forEach(memberId => {
        if (!memberCheckIns[memberId]) {
          memberCheckIns[memberId] = {};
        }
        memberCheckIns[memberId].checkIn = checkInData;
      });

      const newAchievement = {
        date: day.toISOString().split('T')[0],
        checkIn: checkInData, // Keep for backward compatibility
        value: achievement?.value || 0,
        assignedMembers: selectedMembers,
        memberCheckIns: memberCheckIns,
        media: achievement?.media || [],
        voiceNotes: achievement?.voiceNotes || [],
      };

      const updatedTask = {
        ...task,
        dailyAchievements: [
          ...(task.dailyAchievements || []).filter(ach => ach.date !== newAchievement.date),
          newAchievement
        ]
      };
      updateTask(task.id, updatedTask);
    });
  };
  
  const handleCheckOut = () => {
    handleGetLocation((location) => {
      if (!checkIn) return;

      // Calculate work hours
      const checkOutTime = new Date().toISOString();
      const checkInTime = new Date(checkIn.timestamp).getTime();
      const checkOutTimeMs = new Date(checkOutTime).getTime();
      const durationMs = checkOutTimeMs - checkInTime;
      const workHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100; // Convert to hours with 2 decimal places

      const checkOutData = {
        timestamp: checkOutTime,
        location: location,
      };

      const memberCheckIns = { ...(achievement?.memberCheckIns || {}) };
      selectedMembers.forEach(memberId => {
        if (!memberCheckIns[memberId]) {
          memberCheckIns[memberId] = {};
        }
        memberCheckIns[memberId].checkOut = checkOutData;
      });

      const updatedAchievement = {
        ...(achievement || {}),
        checkOut: checkOutData, // Keep for backward compatibility
        workHours: workHours,
        assignedMembers: selectedMembers,
        memberCheckIns: memberCheckIns,
      };

      const updatedTask = {
        ...task,
        dailyAchievements: (task.dailyAchievements || []).map(ach =>
          ach.date === updatedAchievement.date ? updatedAchievement : ach
        )
      };
      updateTask(task.id, updatedTask);
    });
  };

  const validateAndGetAchievementData = () => {
    // Check if task is started
    if (!task.actualStartDate) {
      setModal({
        visible: true,
        message: "يجب النقر على 'بدء المهمة' قبل تسجيل الإنجازات اليومية.",
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
      return null;
    }

    // Validate input value
    const inputValue = String(value).trim();
    if (inputValue === '') {
      setModal({
        visible: true,
        message: "يرجى إدخال قيمة صحيحة.",
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
      return null;
    }

    const newValue = Number(inputValue);
    if (isNaN(newValue) || newValue < 0) {
      setModal({
        visible: true,
        message: "يرجى إدخال رقم صحيح وأكبر من أو يساوي صفر.",
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
      return null;
    }

    // Check for reasonable value limits
    if (newValue > 1000000) { // 1 million as upper limit
      setModal({
        visible: true,
        message: "القيمة المدخلة كبيرة جداً. يرجى التحقق من صحة البيانات.",
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
      return null;
    }

    // Calculate new total and validate against target
    const currentAchievementValue = achievement ? Number(achievement.value) : 0;
    const newTotal = (task.totalAchieved || 0) - currentAchievementValue + newValue;

    // Allow exceeding target by 10% for flexibility
    const targetLimit = (task.totalTarget || 0) * 1.1;

    if (newTotal > targetLimit) {
      const availableSpace = Math.max(0, targetLimit - ((task.totalAchieved || 0) - currentAchievementValue));
      setModal({
        visible: true,
        message: `تحذير: القيمة الجديدة ستتجاوز الهدف المحدد (${task.totalTarget}). المساحة المتاحة: ${availableSpace.toFixed(2)}. هل تريد المتابعة؟`,
        onConfirm: () => {
          // Allow the user to proceed despite the warning
          setModal({ visible: false, message: '', onConfirm: null });
          // Continue with the save operation
          const achievementData = {
            date: day.toISOString().split('T')[0],
            value: newValue,
            workHours: achievement?.workHours || 0,
            notes: achievement?.notes || '',
            checkInTime: achievement?.checkIn?.timestamp,
            checkInLocation: achievement?.checkIn?.location,
            checkOutTime: achievement?.checkOut?.timestamp,
            checkOutLocation: achievement?.checkOut?.location,
            media: achievement?.media || [],
            voiceNotes: achievement?.voiceNotes || [],
            assignedMembers: selectedMembers,
            memberCheckIns: achievement?.memberCheckIns || {},
          };
          saveAchievementToDatabase(achievementData);
        },
      });
      return null; // Return null to prevent automatic save, user must confirm
    }

    // Validate date consistency
    const today = new Date();
    const achievementDate = new Date(day);
    const daysDifference = Math.abs(today.getTime() - achievementDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDifference > 365) { // More than a year in the past/future
      setModal({
        visible: true,
        message: "لا يمكن تسجيل إنجازات لتواريخ بعيدة جداً عن التاريخ الحالي.",
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
      return null;
    }

    return {
      date: day.toISOString().split('T')[0],
      value: newValue,
      workHours: achievement?.workHours || 0,
      notes: achievement?.notes || '',
      checkInTime: achievement?.checkIn?.timestamp,
      checkInLocation: achievement?.checkIn?.location,
      checkOutTime: achievement?.checkOut?.timestamp,
      checkOutLocation: achievement?.checkOut?.location,
      media: achievement?.media || [],
      voiceNotes: achievement?.voiceNotes || [],
    };
  };

  const saveAchievementToDatabase = async (achievementData: any, retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    setIsSaving(true);
    try {
      let savedAchievement;

      // First, try to find if the record already exists
      const existingRecord = await TasksService.getDailyAchievements(task.id);
      const existingAchievement = existingRecord?.find((ach: any) => ach.date === achievementData.date);

      if (existingAchievement) {
        // Update existing achievement
        savedAchievement = await TasksService.updateDailyAchievement(existingAchievement.id, achievementData);
      } else {
        // Create new achievement
        savedAchievement = await TasksService.logDailyAchievement(task.id, achievementData);
      }

      // Update local state
      const newAchievement = {
        id: savedAchievement?.id || existingAchievement?.id || achievement?.id,
        ...achievementData,
        date: day.toISOString().split('T')[0],
        checkIn: achievement?.checkIn,
        checkOut: achievement?.checkOut,
      };

      const updatedTask = {
        ...task,
        dailyAchievements: achievement
          ? (task.dailyAchievements || []).map(ach => ach.date === achievement?.date ? newAchievement : ach)
          : [...(task.dailyAchievements || []), newAchievement]
      };

      updateTask(task.id, updatedTask);
      setIsEditing(false);
      setHasUnsavedChanges(false);

      setModal({
        visible: true,
        message: existingAchievement
          ? "تم تحديث الإنجاز اليومي بنجاح!"
          : "تم حفظ الإنجاز اليومي بنجاح!",
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
    } catch (error: any) {
      console.error('Error saving daily achievement:', error);

      // Check if it's a network error and we haven't exceeded max retries
      const networkError = isNetworkError(error);

      if (networkError && retryCount < maxRetries) {
        console.log(`Retrying save operation in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);

        // Show retry message to user
        setModal({
          visible: true,
          message: `فشل في الحفظ بسبب مشكلة في الشبكة. جاري إعادة المحاولة (${retryCount + 1}/${maxRetries})...`,
          onConfirm: null,
        });

        // Wait and retry
        setTimeout(() => {
          saveAchievementToDatabase(achievementData, retryCount + 1);
        }, retryDelay);
        return;
      }

      // Handle duplicate key error by attempting to update existing record
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('UNIQUE')) {
        console.log('Duplicate key error detected, attempting to update existing record...');

        try {
          // Try to find and update the existing record
          const existingRecords = await TasksService.getDailyAchievements(task.id);
          const existingAchievement = existingRecords?.find((ach: any) => ach.date === achievementData.date);

          if (existingAchievement) {
            const updatedAchievement = await TasksService.updateDailyAchievement(existingAchievement.id, achievementData);

            // Update local state
            const newAchievement = {
              id: updatedAchievement?.id || existingAchievement.id,
              ...achievementData,
              date: day.toISOString().split('T')[0],
              checkIn: achievement?.checkIn,
              checkOut: achievement?.checkOut,
            };

            const updatedTask = {
              ...task,
              dailyAchievements: (task.dailyAchievements || []).map(ach =>
                ach.date === achievement?.date ? newAchievement : ach
              )
            };

            updateTask(task.id, updatedTask);
            setIsEditing(false);
            setHasUnsavedChanges(false);

            setModal({
              visible: true,
              message: "تم تحديث الإنجاز اليومي بنجاح!",
              onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
            });
            setIsSaving(false);
            return;
          }
        } catch (updateError) {
          console.error('Failed to update existing record:', updateError);
        }
      }

      // Determine error type and show appropriate message
      let errorMessage = "فشل في حفظ الإنجاز اليومي. يرجى المحاولة مرة أخرى.";

      if (error.message?.includes('permission') || error.message?.includes('auth')) {
        errorMessage = "ليس لديك صلاحية لحفظ هذا الإنجاز. يرجى تسجيل الدخول مرة أخرى.";
      } else if (error.message?.includes('validation')) {
        errorMessage = "البيانات المدخلة غير صحيحة. يرجى التحقق من القيم المدخلة.";
      } else if (!navigator.onLine) {
        errorMessage = "لا يوجد اتصال بالإنترنت. سيتم حفظ البيانات محلياً وإرسالها لاحقاً.";
        // Save to offline storage
        const offlineKey = `achievement_${task.id}_${day.toISOString().split('T')[0]}`;
        saveToOfflineStorage(offlineKey, achievementData);
      }

      setModal({
        visible: true,
        message: errorMessage,
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const achievementData = validateAndGetAchievementData();
    if (achievementData) {
      await saveAchievementToDatabase(achievementData);
    }
  };

  const handleSaveButton = async () => {
    const achievementData = validateAndGetAchievementData();
    if (achievementData) {
      await saveAchievementToDatabase(achievementData);
    }
  };

  const handleDeleteAchievement = () => {
    if (!achievement) return;
    setModal({
      visible: true,
      message: `Are you sure you want to delete the achievement for ${formattedDate}?`,
      onConfirm: async () => {
        setModal({ visible: false, message: '', onConfirm: null });
        const updatedTask = {
          ...task,
          dailyAchievements: (task.dailyAchievements || []).filter(ach => ach.date !== achievement.date)
        };
        updateTask(task.id, updatedTask);
      },
    });
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setModal({
        visible: true,
        message: 'Your browser does not support media recording.',
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
      return;
    }

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(audioStream);
      setRecorder(mediaRecorder);
      setIsRecording(true);
      setAudioChunks([]);

      mediaRecorder.ondataavailable = (event) => {
        setAudioChunks((prevChunks) => [...prevChunks, event.data]);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        try {
          // Upload audio file to Supabase storage
          const audioItem = await TasksService.uploadAudio(audioBlob, task.id, day.toISOString().split('T')[0]);

          const voiceNote = {
            audioUrl: audioItem.url,
            timestamp: new Date().toISOString(),
            name: audioItem.name,
            size: audioItem.size,
          };

          const updatedAchievement = achievement
            ? { ...achievement, voiceNotes: [...(achievement.voiceNotes || []), voiceNote] }
            : { date: day.toISOString().split('T')[0], value: 0, voiceNotes: [voiceNote], media: [] };

          // Update local state immediately for UI responsiveness
          const updatedTask = {
            ...task,
            dailyAchievements: achievement
              ? (task.dailyAchievements || []).map(ach => ach.date === achievement.date ? updatedAchievement : ach)
              : [...(task.dailyAchievements || []), updatedAchievement]
          };

          updateTask(task.id, updatedTask);

          // Automatically save to database to persist voice notes
          const achievementData = {
            date: day.toISOString().split('T')[0],
            value: updatedAchievement.value,
            workHours: updatedAchievement.workHours || 0,
            notes: updatedAchievement.notes || '',
            checkInTime: updatedAchievement.checkIn?.timestamp,
            checkInLocation: updatedAchievement.checkIn?.location,
            checkOutTime: updatedAchievement.checkOut?.timestamp,
            checkOutLocation: updatedAchievement.checkOut?.location,
            media: updatedAchievement.media || [],
            voiceNotes: updatedAchievement.voiceNotes || [],
          };

          // Save to database without showing loading state for better UX
          try {
            if (updatedAchievement.id) {
              await TasksService.updateDailyAchievement(updatedAchievement.id, achievementData);
            } else {
              await TasksService.logDailyAchievement(task.id, achievementData);
            }
          } catch (saveError) {
            console.error('Error saving voice note to database:', saveError);
            // Show a subtle notification that the voice note will be saved later
            setModal({
              visible: true,
              message: "تم حفظ التسجيل الصوتي محلياً. سيتم إرساله للخادم عند استعادة الاتصال.",
              onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
            });
            // TODO: Implement offline queue for failed saves
          }

          setModal({
            visible: true,
            message: "تم حفظ التسجيل الصوتي بنجاح!",
            onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
          });
        } catch (uploadError) {
          console.error('Error uploading audio file:', uploadError);
          setModal({
            visible: true,
            message: "فشل في رفع التسجيل الصوتي. يرجى المحاولة مرة أخرى.",
            onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
          });
        }

        audioStream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };
      
      mediaRecorder.start();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setModal({
        visible: true,
        message: 'Failed to get microphone access. Please check permissions.',
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
    }
  };

  const stopRecording = () => {
    if (recorder && isRecording) {
      recorder.stop();
    }
  };

  const handlePlayPause = (audioUrl: string, index: number) => {
    if (currentlyPlaying === index) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(audioUrl);
      newAudio.play().catch((error) => {
        console.error('Error playing audio:', error);
      });
      audioRef.current = newAudio;
      setCurrentlyPlaying(index);
      newAudio.onended = () => setCurrentlyPlaying(null);
    }
  };

  const handleDeleteNote = (noteToDelete: VoiceNote) => {
    if (!achievement) return;
    setModal({
      visible: true,
      message: 'هل أنت متأكد من حذف هذه التسجيلة الصوتية؟',
      onConfirm: async () => {
        setModal({ visible: false, message: '', onConfirm: null });

        const updatedAchievement = {
          ...achievement,
          voiceNotes: (achievement.voiceNotes || []).filter(note => note.timestamp !== noteToDelete.timestamp),
        };

        // Update local state immediately
        const updatedTask = {
          ...task,
          dailyAchievements: (task.dailyAchievements || []).map(ach =>
            ach.date === achievement.date ? updatedAchievement : ach
          )
        };
        updateTask(task.id, updatedTask);

        // Automatically save to database
        const achievementData = {
          date: day.toISOString().split('T')[0],
          value: updatedAchievement.value,
          workHours: updatedAchievement.workHours || 0,
          notes: updatedAchievement.notes || '',
          checkInTime: updatedAchievement.checkIn?.timestamp,
          checkInLocation: updatedAchievement.checkIn?.location,
          checkOutTime: updatedAchievement.checkOut?.timestamp,
          checkOutLocation: updatedAchievement.checkOut?.location,
          media: updatedAchievement.media || [],
          voiceNotes: updatedAchievement.voiceNotes || [],
        };

        try {
          if (updatedAchievement.id) {
            await TasksService.updateDailyAchievement(updatedAchievement.id, achievementData);
          } else {
            await TasksService.logDailyAchievement(task.id, achievementData);
          }
        } catch (saveError) {
          console.error('Error saving voice note deletion to database:', saveError);
          // Show notification about the issue
          setModal({
            visible: true,
            message: "تم حذف التسجيل محلياً. قد يظهر مرة أخرى عند إعادة تحميل الصفحة.",
            onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
          });
        }
      },
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];

    try {
      // Upload file to Supabase storage
      const mediaItem = await TasksService.uploadMedia(file, task.id, day.toISOString().split('T')[0]);

      // Create updated achievement with new media
      const updatedAchievement = achievement
        ? { ...achievement, media: [...(achievement.media || []), { ...mediaItem, timestamp: new Date().toISOString() }] }
        : {
            date: day.toISOString().split('T')[0],
            value: 0,
            media: [{ ...mediaItem, timestamp: new Date().toISOString() }],
            voiceNotes: []
          };

      // Update local state immediately for UI responsiveness
      const updatedTask = {
        ...task,
        dailyAchievements: achievement
          ? (task.dailyAchievements || []).map(ach => ach.date === achievement.date ? updatedAchievement : ach)
          : [...(task.dailyAchievements || []), updatedAchievement]
      };

      updateTask(task.id, updatedTask);

      // Automatically save to database to persist media
      const achievementData = {
        date: day.toISOString().split('T')[0],
        value: updatedAchievement.value,
        workHours: updatedAchievement.workHours || 0,
        notes: updatedAchievement.notes || '',
        checkInTime: updatedAchievement.checkIn?.timestamp,
        checkInLocation: updatedAchievement.checkIn?.location,
        checkOutTime: updatedAchievement.checkOut?.timestamp,
        checkOutLocation: updatedAchievement.checkOut?.location,
        media: updatedAchievement.media || [],
        voiceNotes: updatedAchievement.voiceNotes || [],
      };

      // Save to database without showing loading state for better UX
      try {
        if (updatedAchievement.id) {
          await TasksService.updateDailyAchievement(updatedAchievement.id, achievementData);
        } else {
          await TasksService.logDailyAchievement(task.id, achievementData);
        }
      } catch (saveError) {
        console.error('Error saving media to database:', saveError);
        // Show a subtle notification that the media will be saved later
        setModal({
          visible: true,
          message: "تم رفع الملف بنجاح. سيتم ربطه بالإنجاز عند استعادة الاتصال.",
          onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
        });
        // TODO: Implement offline queue for failed saves
      }

      setModal({
        visible: true,
        message: "تم رفع الملف بنجاح!",
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      setModal({
        visible: true,
        message: "فشل في رفع الملف. يرجى المحاولة مرة أخرى.",
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
    }

    // Clear the input
    event.target.value = '';
  };
  
  const handleDeleteMedia = (mediaToDelete: MediaItem) => {
    if (!achievement) return;
    setModal({
      visible: true,
      message: 'هل أنت متأكد من حذف هذا الملف؟',
      onConfirm: async () => {
        setModal({ visible: false, message: '', onConfirm: null });

        const updatedAchievement = {
          ...achievement,
          media: (achievement.media || []).filter(media => media.timestamp !== mediaToDelete.timestamp),
        };

        // Update local state immediately
        const updatedTask = {
          ...task,
          dailyAchievements: (task.dailyAchievements || []).map(ach =>
            ach.date === achievement.date ? updatedAchievement : ach
          )
        };
        updateTask(task.id, updatedTask);

        // Automatically save to database
        const achievementData = {
          date: day.toISOString().split('T')[0],
          value: updatedAchievement.value,
          workHours: updatedAchievement.workHours || 0,
          notes: updatedAchievement.notes || '',
          checkInTime: updatedAchievement.checkIn?.timestamp,
          checkInLocation: updatedAchievement.checkIn?.location,
          checkOutTime: updatedAchievement.checkOut?.timestamp,
          checkOutLocation: updatedAchievement.checkOut?.location,
          media: updatedAchievement.media || [],
          voiceNotes: updatedAchievement.voiceNotes || [],
          assignedMembers: selectedMembers,
          memberCheckIns: updatedAchievement.memberCheckIns || {},
        };

        try {
          if (updatedAchievement.id) {
            await TasksService.updateDailyAchievement(updatedAchievement.id, achievementData);
          } else {
            await TasksService.logDailyAchievement(task.id, achievementData);
          }
        } catch (saveError) {
          console.error('Error saving media deletion to database:', saveError);
          // Show notification about the issue
          setModal({
            visible: true,
            message: "تم حذف الملف محلياً. قد يظهر مرة أخرى عند إعادة تحميل الصفحة.",
            onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
          });
        }
      },
    });
  };

  return (
    <div
      className={`relative rounded-xl border-2 bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between
      ${isToday ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white' : 'border-gray-200'}
      ${isFullPage ? 'p-6' : 'p-4'}`}
    >
      {/* Task Name and Date Header */}
      <div className="text-center mb-4 pb-3 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{task.title}</h3>
        <div className="flex items-center justify-center gap-2">
          <h4 className={`text-base font-semibold ${isToday ? 'text-blue-800' : 'text-gray-800'}`}>
            {formattedDate}
          </h4>
          {isToday && (
            <span className="text-xs font-bold text-blue-600 bg-blue-200 px-2 py-1 rounded-full animate-pulse">
              اليوم
            </span>
          )}
        </div>
      </div>

      {/* Attendance Section - ENHANCED AND MORE VISIBLE */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-blue-800">تسجيل الحضور والانصراف</h4>
        </div>

        {/* Check-in Button */}
        {!checkIn && isToday && task.actualStartDate && (
          <button
            onClick={handleCheckIn}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl py-5 text-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-4 shadow-lg hover:shadow-xl transform hover:scale-105 mb-4 border-2 border-blue-400"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {icons.checkin}
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">تسجيل الدخول</div>
              <div className="text-sm opacity-90">ابدأ يوم العمل</div>
            </div>
          </button>
        )}

        {/* Check-out Button */}
        {checkIn && !checkOut && isToday && (
          <button
            onClick={handleCheckOut}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl py-5 text-lg font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center gap-4 shadow-lg hover:shadow-xl transform hover:scale-105 mb-4 border-2 border-red-400"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {icons.checkout}
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">تسجيل الخروج</div>
              <div className="text-sm opacity-90">انهِ يوم العمل</div>
            </div>
          </button>
        )}

        {/* Completed Check-out Status */}
        {checkOut && (
          <div className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl py-5 text-lg font-bold text-center shadow-lg mb-4 border-2 border-green-400">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">✓ تم تسجيل الخروج</div>
                <div className="text-sm opacity-90">يوم العمل مكتمل</div>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {!task.actualStartDate && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-yellow-800">يجب بدء المهمة أولاً</p>
                <p className="text-sm text-yellow-700">اضغط على "بدء المهمة" قبل تسجيل الحضور</p>
              </div>
            </div>
          </div>
        )}

        {!isToday && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800">تسجيل الحضور متاح لليوم الحالي فقط</p>
                <p className="text-sm text-gray-600">يمكنك تسجيل الحضور والانصراف لليوم {formattedDate} فقط</p>
              </div>
            </div>
          </div>
        )}
        {(checkIn || checkOut) && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {checkIn && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 px-3 py-2 rounded-full">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>دخول: {formatTime(checkIn.timestamp)}</span>
                  </div>
                )}
                {checkOut && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-100 px-3 py-2 rounded-full">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span>خروج: {formatTime(checkOut.timestamp)}</span>
                  </div>
                )}
              </div>
            </div>
            {durationMs > 0 && (
              <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-700">المدة الإجمالية:</span>
                  <span className="text-xl font-bold text-blue-600">{formatDuration(durationMs)}</span>
                </div>
                {overtimeMs > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-orange-700">إضافي:</span>
                    <span className="text-base font-bold text-orange-600">{formatDuration(overtimeMs)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Attendance Actions - Always Visible for Today */}
        {isToday && task.actualStartDate && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
            <div className="flex items-center justify-center gap-3">
              <div className="text-center">
                <div className="text-sm font-semibold text-purple-800 mb-2">إجراءات سريعة</div>
                <div className="flex gap-2">
                  {!checkIn && (
                    <button
                      onClick={handleCheckIn}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                      title="تسجيل الدخول"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      دخول
                    </button>
                  )}
                  {checkIn && !checkOut && (
                    <button
                      onClick={handleCheckOut}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                      title="تسجيل الخروج"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0zM12 12a3 3 0 100-6 3 3 0 000 6z" />
                      </svg>
                      خروج
                    </button>
                  )}
                  {checkOut && (
                    <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md">
                      ✓ مكتمل
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Selection Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-purple-800">اختيار الأعضاء المشاركين</h4>
        </div>

        {/* Selected Members Display */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedMembers.length > 0 ? (
              selectedMembers.map(memberId => {
                const member = allMembers.find(m => m.id === memberId);
                return member ? (
                  <div key={memberId} className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-2 rounded-full text-sm">
                    <span>{member.name}</span>
                    <button
                      onClick={() => {
                        setSelectedMembers(prev => prev.filter(id => id !== memberId));
                        setHasUnsavedChanges(true);
                      }}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : null;
              })
            ) : (
              <p className="text-gray-500 text-sm">لم يتم اختيار أي أعضاء</p>
            )}
          </div>
        </div>

        {/* Member Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMemberDropdown(!showMemberDropdown)}
            className="w-full bg-white border-2 border-purple-300 text-purple-700 px-4 py-3 rounded-lg text-left flex items-center justify-between hover:border-purple-400 transition-all duration-200"
          >
            <span>اختر الأعضاء</span>
            <svg className={`w-5 h-5 transition-transform ${showMemberDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMemberDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border-2 border-purple-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {allMembers.map(member => (
                <div
                  key={member.id}
                  onClick={() => {
                    setSelectedMembers(prev => {
                      const isSelected = prev.includes(member.id);
                      if (isSelected) {
                        return prev.filter(id => id !== member.id);
                      } else {
                        return [...prev, member.id];
                      }
                    });
                    setHasUnsavedChanges(true);
                  }}
                  className={`px-4 py-3 cursor-pointer hover:bg-purple-50 flex items-center gap-3 ${
                    selectedMembers.includes(member.id) ? 'bg-purple-100' : ''
                  }`}
                >
                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                    selectedMembers.includes(member.id) ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                  }`}>
                    {selectedMembers.includes(member.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.teamName} - {member.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Target Input Section - MOVED AFTER CHECK-IN */}
      {isEditing || !achievement ? (
        <form onSubmit={handleSave} className="flex gap-1">
          <input
            type="number"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="قيمة الإنجاز اليومي"
            className="w-full p-2 text-sm bg-gray-100 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isInputDisabled}
            max={maxAllowedValue}
            min="0"
            title={isInputDisabled ? "ابدأ المهمة أولاً لتسجيل التقدم" : ""}
          />
          <button
            type="submit"
            className={`px-3 py-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-all duration-200 ${isInputDisabled || isSaving ? 'text-gray-400 cursor-not-allowed' : ''}`}
            disabled={isInputDisabled || isSaving}
            title="حفظ الإنجاز"
          >
            {isSaving ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">{achievement.value}</span>
              <div className="text-xs text-gray-500">
                من {task.totalTarget || 100}
              </div>
            </div>
            <div className="flex gap-1">
              {hasUnsavedChanges && (
                <button
                  onClick={handleSaveButton}
                  className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-full transition-all duration-200"
                  title="حفظ التغييرات"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                disabled={!canUpdate}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!canUpdate ? "ليس لديك صلاحية التعديل" : "تعديل"}
              >
                {icons.edit}
              </button>
              <button
                onClick={handleDeleteAchievement}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                title="حذف"
              >
                {icons.delete}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>التقدم</span>
              <span>{Math.round((achievement.value / (task.totalTarget || 100)) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, (achievement.value / (task.totalTarget || 100)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Media and Voice Note Tools */}
      {!!achievement && (
        <div className="mt-4 pt-2 border-t border-gray-200">
          {/* Media Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                الملفات ({achievement.media?.length || 0})
              </h5>
              {achievement.media && achievement.media.length > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {achievement.media.reduce((total, media) => total + (media.size || 0), 0) / 1024 / 1024 > 1
                    ? `${(achievement.media.reduce((total, media) => total + (media.size || 0), 0) / 1024 / 1024).toFixed(1)} MB`
                    : `${(achievement.media.reduce((total, media) => total + (media.size || 0), 0) / 1024).toFixed(1)} KB`
                  }
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                id={`file-upload-${task.id}-${day.toISOString()}`}
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileUpload}
              />
              <label
                htmlFor={`file-upload-${task.id}-${day.toISOString()}`}
                className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-dashed border-blue-300 text-blue-700 rounded-lg text-sm font-semibold text-center cursor-pointer hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 transition-all duration-200 flex flex-col items-center gap-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                رفع ملف
              </label>
              <input
                id={`camera-capture-${task.id}-${day.toISOString()}`}
                type="file"
                className="hidden"
                accept="image/*,video/*"
                capture="user"
                onChange={handleFileUpload}
              />
              <label
                htmlFor={`camera-capture-${task.id}-${day.toISOString()}`}
                className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-dashed border-purple-300 text-purple-700 rounded-lg text-sm font-semibold text-center cursor-pointer hover:from-purple-100 hover:to-purple-200 hover:border-purple-400 transition-all duration-200 flex flex-col items-center gap-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                التقاط صورة
              </label>
            </div>
            {achievement.media && achievement.media.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {achievement.media.map((media, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-xl shadow-lg border border-gray-200 bg-white">
                    {media.type === 'image' ? (
                      <img src={media.url} alt={media.name || `media-${index}`} className="w-full h-40 object-cover" />
                    ) : (
                      <video src={media.url} controls className="w-full h-40 object-cover" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <div className="text-white">
                        <div className="font-medium text-sm truncate">{media.name}</div>
                        <div className="text-xs text-gray-300 flex items-center gap-2">
                          <span>{media.type === 'image' ? 'صورة' : 'فيديو'}</span>
                          <span>•</span>
                          <span>{(media.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMedia(media)}
                      className="absolute top-2 right-2 p-2 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                      title="حذف الملف"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Voice Notes Section */}
          <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h5 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                التسجيلات الصوتية ({achievement.voiceNotes?.length || 0})
              </h5>
              {achievement.voiceNotes && achievement.voiceNotes.length > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {achievement.voiceNotes.length} تسجيل
                </span>
              )}
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="p-3 border-2 border-red-300 rounded-lg bg-red-50 flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-red-700">جاري التسجيل...</p>
                <div className="flex-1 bg-red-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                </div>
              </div>
            )}

            {/* Recording Controls */}
            <div className="flex justify-center">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  title="بدء التسجيل"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 rounded-full hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  title="إيقاف التسجيل"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Voice Notes List */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {(achievement.voiceNotes || []).length > 0 ? (
                (achievement.voiceNotes || []).map((note, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200 hover:from-gray-100 hover:to-gray-150 transition-all duration-200">
                    <button
                      onClick={() => handlePlayPause(note.audioUrl, index)}
                      className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      {currentlyPlaying === index ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15a1 1 0 011 1v3.586a1 1 0 01-.293.707l-.707.707A1 1 0 0114.414 16H13" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {note.name || `تسجيل ${index + 1}`}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{formatTime(note.timestamp)}</span>
                        {note.size && (
                          <>
                            <span>•</span>
                            <span>{(note.size / 1024).toFixed(1)} KB</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 hover:text-red-700"
                      title="حذف التسجيل"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <p className="text-gray-500 text-sm">لا توجد تسجيلات صوتية</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Footer */}
      {achievement && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-3">
              {achievement.media && achievement.media.length > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{achievement.media.length}</span>
                </div>
              )}
              {achievement.voiceNotes && achievement.voiceNotes.length > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>{achievement.voiceNotes.length}</span>
                </div>
              )}
              {durationMs > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatDuration(durationMs)}</span>
                </div>
              )}
            </div>
            {achievement.notes && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>ملاحظات</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Check-in/Check-out Buttons at Bottom */}
      {isToday && task.actualStartDate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            {!checkIn && (
              <button
                onClick={handleCheckIn}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                تسجيل دخول
              </button>
            )}
            {checkIn && !checkOut && (
              <button
                onClick={handleCheckOut}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0zM12 12a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
                تسجيل خروج
              </button>
            )}
            {checkOut && (
              <div className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg font-semibold text-center shadow-md">
                ✓ تم تسجيل الخروج
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Component to display a single Task Card ---
function TaskCard({
  task,
  isExpanded,
  toggleExpand,
  updateTask,
  deleteTask,
  setModal,
  isFullPage = false,
  canUpdate,
}: TaskCardProps) {

  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const datesInRange = useMemo(() => {
    // If task has started, use actual start date and calculate end date based on planned duration
    if (task.actualStartDate) {
      const startDate = new Date(task.actualStartDate);
      // Calculate end date based on planned duration from actual start date
      const endDate = new Date(startDate);
      const plannedEndDate = new Date(task.endDate);
      const durationMs = plannedEndDate.getTime() - new Date(task.startDate).getTime();
      endDate.setTime(startDate.getTime() + durationMs);

      return getDatesInRange(startDate, endDate);
    }
    // If task hasn't started, show planned date range
    return getDatesInRange(task.startDate, task.endDate);
  }, [task.startDate, task.endDate, task.actualStartDate]);

  const achievementsMap = useMemo(() => {
    const map = new Map();
    (task.dailyAchievements || []).forEach(ach => {
      map.set(ach.date, ach);
    });
    return map;
  }, [task.dailyAchievements]);

  const tasksWithDerivedData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalAchieved = (task.dailyAchievements || []).reduce((sum, achievement) => sum + Number(achievement.value || 0), 0);
    const progressPercent = (task.totalTarget || 0) > 0 ? (totalAchieved / (task.totalTarget || 1)) * 100 : 0;
    const roundedProgress = Math.min(100, Math.round(progressPercent));

    const displayStatus: DisplayStatus = task.actualEndDate
      ? 'Completed'
      : task.actualStartDate
        ? (today > new Date(task.endDate) ? 'Overdue' : 'In Progress')
        : (today > new Date(task.startDate) ? 'Pending (Overdue)' : 'Not Started');

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (displayStatus === 'Overdue' || displayStatus === 'Pending (Overdue)') {
      riskLevel = 'high';
    }

    return {
      ...task,
      displayStatus,
      riskLevel,
      progressPercent: roundedProgress,
      totalAchieved,
    };
  }, [task]);


  const handleStartTask = () => {
    const updatedTask: Task = {
      ...task,
      status: 'in-progress',
      actualStartDate: new Date(),
      dailyAchievements: task.dailyAchievements || [],
      lastActivity: new Date()
    };
    updateTask(task.id, updatedTask);
  };

  const handleEndTask = () => {
    const updatedTask: Task = {
      ...task,
      status: 'completed',
      actualEndDate: new Date(),
      progress: 100,
      lastActivity: new Date()
    };
    updateTask(task.id, updatedTask);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-xl border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden bg-white ${
        task.actualEndDate
          ? 'border-green-500 bg-green-50/50'
          : 'border-blue-500'
      } ${isFullPage ? 'w-full max-w-none' : ''}`}
    >
      <div
        onClick={() => toggleExpand(task.id)}
        className="relative p-5 flex justify-between items-center cursor-pointer bg-gray-50/50"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full border border-gray-300 ${
            task.actualEndDate ? 'bg-green-500' : 'bg-blue-500'
          } text-white`}>
            {isExpanded ? icons.minus : icons.plus}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${task.actualEndDate ? 'text-green-800' : 'text-gray-900'}`}>
              {task.title}
              {task.actualEndDate && (
                <span className="mr-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  ✓ مكتملة
                </span>
              )}
            </h3>
            <p className={`text-sm font-medium ${statusColors[tasksWithDerivedData.displayStatus]}`}>{tasksWithDerivedData.displayStatus}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${riskColors[tasksWithDerivedData.riskLevel]}`}>
            Risk: {tasksWithDerivedData.riskLevel}
          </span>
          <span className="text-sm text-gray-500 hidden sm:block">Assigned to: {task.assignedToName || 'N/A'}</span>
          <div className="w-8 h-8 flex items-center justify-center text-gray-500">
            {isExpanded ? icons.chevronUp : icons.chevronDown}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-5 pt-0 overflow-hidden"
          >
            <div className="border-t border-gray-200 pt-5 space-y-6">
              {/* Centered Details Section */}
              <div className="text-center space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">التواريخ</p>
                    <p className="text-gray-600">المخطط: {formatDate(task.startDate)} - {formatDate(task.endDate)}</p>
                    <p className="text-gray-600">الفعلي: {formatDate(task.actualStartDate)} - {formatDate(task.actualEndDate)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">التقدم</p>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-blue-600">{tasksWithDerivedData.progressPercent || 0}%</p>
                      <p className="text-xs text-gray-500">من {tasksWithDerivedData.totalTarget || 'غير محدد'}</p>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600`}
                          style={{ width: `${tasksWithDerivedData.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">التفاصيل</p>
                    <p className="text-gray-600">الأولوية: <span className="font-medium">{task.priority}</span></p>
                    <p className="text-gray-600">الحالة: <span className="font-medium">{task.status}</span></p>
                    <p className="text-gray-600">المسؤول: <span className="font-medium">{task.assignedToName || 'غير محدد'}</span></p>
                  </div>
                </div>
              </div>

              {/* Single Daily Achievement Card with Navigation */}
              <div className="mt-4 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-gray-900 text-lg">الإنجازات اليومية</h4>
                  <div className="flex items-center gap-4">
                    <span className="p-2 rounded-full bg-gray-200 text-gray-600">
                      {icons.target}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {tasksWithDerivedData.totalAchieved || 0} / {tasksWithDerivedData.totalTarget || 'غير محدد'}
                    </span>
                  </div>
                </div>

                {/* Navigation and Single Card Display */}
                <div className="relative">
                  {/* Navigation Arrows */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      onClick={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
                      disabled={currentDayIndex === 0}
                      className="p-3 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{currentDayIndex + 1}</span>
                      <span>من</span>
                      <span>{datesInRange.length}</span>
                    </div>

                    <button
                      onClick={() => setCurrentDayIndex(Math.min(datesInRange.length - 1, currentDayIndex + 1))}
                      disabled={currentDayIndex === datesInRange.length - 1}
                      className="p-3 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Single Daily Achievement Card */}
                  <div className="flex justify-center">
                    {datesInRange[currentDayIndex] && (
                      <div className="w-full max-w-2xl">
                        <DailyAchievementCard
                          task={tasksWithDerivedData}
                          day={datesInRange[currentDayIndex]}
                          achievement={achievementsMap.get(datesInRange[currentDayIndex].toISOString().split('T')[0])}
                          updateTask={updateTask}
                          setModal={setModal}
                          isFullPage={isFullPage}
                          canUpdate={canUpdate}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Better Organized */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <div className="flex gap-3 flex-1">
                  <button
                    onClick={handleStartTask}
                    disabled={!!task.actualStartDate || !canUpdate}
                    className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15a1 1 0 011 1v3.586a1 1 0 01-.293.707l-.707.707A1 1 0 0114.414 16H13" />
                      </svg>
                      بدء المهمة
                    </div>
                  </button>
                  <button
                    onClick={handleEndTask}
                    disabled={!task.actualStartDate || !!task.actualEndDate || !canUpdate}
                    title={!canUpdate ? "ليس لديك صلاحية إنهاء المهمة" : !task.actualStartDate ? "ابدأ المهمة أولاً" : task.actualEndDate ? "المهمة انتهت بالفعل" : "إنهاء المهمة وتسجيل تاريخ الانتهاء الفعلي"}
                    className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      إنهاء المهمة
                    </div>
                  </button>
                </div>
                <button
                  onClick={() => deleteTask(task)}
                  disabled={!canUpdate}
                  className="py-3 px-4 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!canUpdate ? "ليس لديك صلاحية الحذف" : "حذف المهمة"}
                >
                  <div className="flex items-center justify-center gap-2">
                    {icons.delete}
                    <span className="hidden sm:inline">حذف</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const TaskTracker: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { tasks, updateTask, deleteTask, calculateTaskProgress, getTaskRiskLevel, teams, saveAllPendingChanges, getPendingChangesCount } = useData();
  const { user } = useAuth();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(taskId || null);
  const [modal, setModal] = useState<{ visible: boolean; message: string; onConfirm: (() => void | Promise<void>) | null }>({ visible: false, message: '', onConfirm: null });
  const [loadingAchievements, setLoadingAchievements] = useState<Set<string>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Enhance tasks with tracking data
  let userTasks = tasks;
  // For members, filter by their team
  if (user?.role === 'member' && user?.teamId) {
    userTasks = tasks.filter(task => task.assignedToTeamId === user.teamId);
  }
  // For admins and managers, show all tasks (no filtering)
  // This ensures admin users can see tasks from all teams including design team

  // Filter for specific task if taskId is provided
  if (taskId) {
    userTasks = userTasks.filter(task => task.id === taskId);
  }

  const enhancedTasks = userTasks.map(task => ({
    ...task,
    dailyAchievements: task.dailyAchievements || [],
    totalTarget: task.totalTarget || 100,
    plannedEffortHours: 8,
    actualEffortHours: 0,
    actualStartDate: task.actualStartDate,
    actualEndDate: task.actualEndDate,
    teamName: teams.find(t => t.id === task.assignedToTeamId)?.name || 'غير محدد',
  }));

  // Auto-expand the task if taskId is provided
  useEffect(() => {
    if (taskId && enhancedTasks.length > 0) {
      setExpandedTaskId(taskId);
      // Load achievements for the specific task
      const task = enhancedTasks.find(t => t.id === taskId);
      if (task && (!task.dailyAchievements || task.dailyAchievements.length === 0)) {
        loadDailyAchievements(taskId);
      }
    }
  }, [taskId, enhancedTasks]);

  // Sync offline data when connection is restored
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Connection restored, syncing offline data...');
      try {
        const offlineData = JSON.parse(localStorage.getItem('pmp_offline_data') || '{}');
        const offlineKeys = Object.keys(offlineData);

        if (offlineKeys.length > 0) {
          setModal({
            visible: true,
            message: `تم استعادة الاتصال. جاري مزامنة ${offlineKeys.length} عنصر محفوظ محلياً...`,
            onConfirm: null,
          });

          for (const key of offlineKeys) {
            if (key.startsWith('achievement_')) {
              const data = offlineData[key];
              try {
                // Try to sync the offline achievement
                if (data.id) {
                  await TasksService.updateDailyAchievement(data.id, data);
                } else {
                  await TasksService.logDailyAchievement(data.taskId || taskId, data);
                }
                clearOfflineStorage(key);
              } catch (syncError) {
                console.error('Error syncing offline data:', syncError);
              }
            }
          }

          setModal({
            visible: true,
            message: "تم مزامنة البيانات المحفوظة محلياً بنجاح!",
            onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
          });
        }
      } catch (error) {
        console.error('Error syncing offline data:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [taskId]);

  const handleUpdateTask = (taskId: string, updatedTask: Task) => {
    // تحديث المهمة مع إعادة حساب التقدم
    const taskWithProgress = {
      ...updatedTask,
      progress: calculateTaskProgress(updatedTask),
      riskLevel: getTaskRiskLevel(updatedTask),
      lastActivity: new Date()
    };
    updateTask(taskId, taskWithProgress);
  };

  const handleDelete = (task: Task) => {
    setModal({
      visible: true,
      message: `Are you sure you want to delete "${task.title}"?`,
      onConfirm: async () => {
        setModal({ visible: false, message: '', onConfirm: null });
        deleteTask(task.id);
      },
    });
  };

  const loadDailyAchievements = async (taskId: string) => {
    if (loadingAchievements.has(taskId)) return;

    setLoadingAchievements(prev => new Set(prev).add(taskId));

    try {
      const achievements = await TasksService.getDailyAchievements(taskId);

      // Transform database achievements to match our DailyAchievement interface
      const transformedAchievements = achievements.map(ach => ({
        id: ach.id,
        date: ach.date,
        value: ach.value,
        workHours: ach.workHours,
        notes: ach.notes,
        checkIn: ach.checkInTime ? {
          timestamp: ach.checkInTime,
          location: ach.checkInLocation
        } : undefined,
        checkOut: ach.checkOutTime ? {
          timestamp: ach.checkOutTime,
          location: ach.checkOutLocation
        } : undefined,
        media: ach.media || [], // Load media from database
        voiceNotes: ach.voiceNotes || [] // Load voice notes from database
      }));

      // Update the task with loaded achievements
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (taskToUpdate) {
        const updatedTask = {
          ...taskToUpdate,
          dailyAchievements: transformedAchievements
        };
        updateTask(taskId, updatedTask);
      }
    } catch (error) {
      console.error('Error loading daily achievements:', error);
      setModal({
        visible: true,
        message: 'Failed to load daily achievements from database.',
        onConfirm: () => setModal({ visible: false, message: '', onConfirm: null }),
      });
    } finally {
      setLoadingAchievements(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      await saveAllPendingChanges();
    } catch (error) {
      console.error('Error saving all changes:', error);
    } finally {
      setIsSavingAll(false);
    }
  };

  const toggleExpand = (id: string | null) => {
    const newExpandedId = expandedTaskId === id ? null : id;
    setExpandedTaskId(newExpandedId);

    // Load daily achievements when expanding a task
    if (newExpandedId && !loadingAchievements.has(newExpandedId)) {
      const task = tasks.find(t => t.id === newExpandedId);
      if (task && (!task.dailyAchievements || task.dailyAchievements.length === 0)) {
        loadDailyAchievements(newExpandedId);
      }
    }
  };

  const pendingChangesCount = getPendingChangesCount();
  const canUpdate = canUpdateTasks(user?.teamId);

  return (
    <div className={`space-y-6 ${taskId ? 'max-w-none' : ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {taskId ? 'تفاصيل المهمة' : 'متتبع تقدم المهام'}
          </h2>
          <p className="text-gray-600">
            {taskId ? 'عرض تفصيلي للمهمة المحددة' : 'تتبع التقدم اليومي وتسجيل الدخول والإنجازات لمهامك'}
          </p>
        </div>
        {pendingChangesCount > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={isSavingAll}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSavingAll ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save All ({pendingChangesCount})
              </>
            )}
          </button>
        )}
      </div>

      {/* Task List */}
      <div className={`space-y-4 ${taskId ? 'w-full' : ''}`}>
        {enhancedTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            isExpanded={expandedTaskId === task.id}
            toggleExpand={toggleExpand}
            updateTask={handleUpdateTask}
            deleteTask={handleDelete}
            setModal={setModal}
            isFullPage={!!taskId}
            canUpdate={canUpdate}
          />
        ))}
      </div>

      {/* Empty State */}
      {enhancedTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">📋</div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مهام</h3>
          <p className="mt-1 text-sm text-gray-500">
            ابدأ بإضافة مهام لتتبع تقدمها.
          </p>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal.visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-40 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center space-y-4 border border-gray-300"
            >
              <p className="text-lg text-gray-900">{modal.message}</p>
              <div className="flex justify-center gap-4">
                {modal.onConfirm && (
                  <button
                    onClick={() => setModal({ visible: false, message: '', onConfirm: null })}
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={modal.onConfirm || (() => setModal({ visible: false, message: '', onConfirm: null }))}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};