import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

// --- Helpers ---
const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString();
};

const formatTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const formatDuration = (ms) => {
  if (!ms || isNaN(ms)) return '0h';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const getDatesInRange = (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  const dates = [];
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
const DailyAchievementCard = ({ task, day, achievement, updateTask, setModal }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(achievement?.value || '');
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const audioContextRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

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

  const handleGetLocation = (callback) => {
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
            onConfirm: () => setModal({ visible: false, message: '' }),
          });
        }
      );
    } else {
      setModal({
        visible: true,
        message: "Geolocation is not supported by your browser.",
        onConfirm: () => setModal({ visible: false, message: '' }),
      });
    }
  };

  const handleCheckIn = () => {
    if (!task.actualStartDate) {
      setModal({
        visible: true,
        message: "You must 'Start Task' before you can check in.",
        onConfirm: () => setModal({ visible: false, message: '' }),
      });
      return;
    }
    handleGetLocation((location) => {
      const newAchievement = {
        date: day.toISOString().split('T')[0],
        checkIn: {
          timestamp: new Date().toISOString(),
          location: location,
        },
        value: achievement?.value || 0,
        media: achievement?.media || [],
        voiceNotes: achievement?.voiceNotes || [],
      };
      
      const updatedTask = {
        ...task,
        dailyAchievements: [
          ...task.dailyAchievements.filter(ach => ach.date !== newAchievement.date),
          newAchievement
        ]
      };
      updateTask(task.id, updatedTask);
    });
  };
  
  const handleCheckOut = () => {
    handleGetLocation((location) => {
      if (!checkIn) return;
      const updatedAchievement = {
        ...achievement,
        checkOut: {
          timestamp: new Date().toISOString(),
          location: location,
        },
      };

      const updatedTask = {
        ...task,
        dailyAchievements: task.dailyAchievements.map(ach =>
          ach.date === updatedAchievement.date ? updatedAchievement : ach
        )
      };
      updateTask(task.id, updatedTask);
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!task.actualStartDate) {
      setModal({
        visible: true,
        message: "You must click 'Start Task' before you can log daily achievements.",
        onConfirm: () => setModal({ visible: false, message: '' }),
      });
      return;
    }
    
    const newValue = Number(value);
    if (!newValue && newValue !== 0) {
      setModal({
        visible: true,
        message: "Please enter a valid number.",
        onConfirm: () => setModal({ visible: false, message: '' }),
      });
      return;
    }
    
    const currentAchievementValue = achievement ? Number(achievement.value) : 0;
    const newTotal = (task.totalAchieved || 0) - currentAchievementValue + newValue;
    
    if (newTotal > (task.totalTarget || 0)) {
      const availableSpace = (task.totalTarget || 0) - ((task.totalAchieved || 0) - currentAchievementValue);
      setModal({
        visible: true,
        message: `You can't exceed the total target of ${task.totalTarget}. Please enter a value of ${availableSpace} or less.`,
        onConfirm: () => setModal({ visible: false, message: '' }),
      });
      return;
    }

    const newAchievement = {
      date: day.toISOString().split('T')[0],
      value: newValue,
      media: achievement?.media || [],
      voiceNotes: achievement?.voiceNotes || [],
      checkIn: achievement?.checkIn || null,
      checkOut: achievement?.checkOut || null,
    };
    
    const updatedTask = {
      ...task,
      dailyAchievements: achievement
        ? task.dailyAchievements.map(ach => ach.date === achievement.date ? newAchievement : ach)
        : [...task.dailyAchievements, newAchievement]
    };
    
    updateTask(task.id, updatedTask);
    setIsEditing(false);
  };

  const handleDeleteAchievement = () => {
    setModal({
      visible: true,
      message: `Are you sure you want to delete the achievement for ${formattedDate}?`,
      onConfirm: async () => {
        setModal({ visible: false, message: '' });
        const updatedTask = {
          ...task,
          dailyAchievements: task.dailyAchievements.filter(ach => ach.date !== achievement.date)
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
        onConfirm: () => setModal({ visible: false, message: '' }),
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        const voiceNote = {
          audioUrl: URL.createObjectURL(audioBlob),
          timestamp: new Date().toISOString(),
        };

        const updatedAchievement = achievement
          ? { ...achievement, voiceNotes: [...(achievement.voiceNotes || []), voiceNote] }
          : { date: day.toISOString().split('T')[0], value: 0, voiceNotes: [voiceNote], media: [] };

        const updatedTask = {
          ...task,
          dailyAchievements: achievement
            ? task.dailyAchievements.map(ach => ach.date === achievement.date ? updatedAchievement : ach)
            : [...task.dailyAchievements, updatedAchievement]
        };
        
        updateTask(task.id, updatedTask);
        audioStream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };
      
      mediaRecorder.start();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setModal({
        visible: true,
        message: 'Failed to get microphone access. Please check permissions.',
        onConfirm: () => setModal({ visible: false, message: '' }),
      });
    }
  };

  const stopRecording = () => {
    if (recorder && isRecording) {
      recorder.stop();
    }
  };

  const handlePlayPause = (audioUrl, index) => {
    if (currentlyPlaying === index) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(audioUrl);
      newAudio.play();
      audioRef.current = newAudio;
      setCurrentlyPlaying(index);
      newAudio.onended = () => setCurrentlyPlaying(null);
    }
  };

  const handleDeleteNote = (noteToDelete) => {
    setModal({
      visible: true,
      message: 'Are you sure you want to delete this voice note?',
      onConfirm: async () => {
        setModal({ visible: false, message: '' });
        
        const updatedAchievement = {
          ...achievement,
          voiceNotes: (achievement.voiceNotes || []).filter(note => note.timestamp !== noteToDelete.timestamp),
        };
        const updatedTask = {
          ...task,
          dailyAchievements: task.dailyAchievements.map(ach =>
            ach.date === achievement.date ? updatedAchievement : ach
          )
        };
        updateTask(task.id, updatedTask);
      },
    });
  };

  const handleFileUpload = (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
      const mediaItem = {
        url: reader.result,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        timestamp: new Date().toISOString(),
      };
      
      const updatedAchievement = achievement
        ? { ...achievement, media: [...(achievement.media || []), mediaItem] }
        : { date: day.toISOString().split('T')[0], value: 0, media: [mediaItem], voiceNotes: [] };

      const updatedTask = {
        ...task,
        dailyAchievements: achievement
          ? task.dailyAchievements.map(ach => ach.date === achievement.date ? updatedAchievement : ach)
          : [...task.dailyAchievements, updatedAchievement]
      };
      
      updateTask(task.id, updatedTask);
    };

    reader.readAsDataURL(file);
  };
  
  const handleDeleteMedia = (mediaToDelete) => {
    setModal({
      visible: true,
      message: 'Are you sure you want to delete this media?',
      onConfirm: async () => {
        setModal({ visible: false, message: '' });
        
        const updatedAchievement = {
          ...achievement,
          media: (achievement.media || []).filter(media => media.timestamp !== mediaToDelete.timestamp),
        };
        const updatedTask = {
          ...task,
          dailyAchievements: task.dailyAchievements.map(ach =>
            ach.date === achievement.date ? updatedAchievement : ach
          )
        };
        updateTask(task.id, updatedTask);
      },
    });
  };

  return (
    <div
      className={`relative p-3 rounded-md border-2 border-gray-200 bg-white shadow-sm flex flex-col justify-between
      ${isToday ? 'border-blue-500 bg-blue-50' : ''}`}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className={`text-xs font-semibold ${isToday ? 'text-blue-800' : 'text-gray-800'}`}>
          {formattedDate}
        </h4>
        {isToday && <span className="text-[10px] font-bold text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full">Today</span>}
      </div>

      {isEditing || !achievement ? (
        <form onSubmit={handleSave} className="flex gap-1">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            className="w-full p-1 text-sm bg-gray-100 border border-gray-300 rounded focus:outline-none"
            required
            disabled={isInputDisabled}
            max={maxAllowedValue}
            min="0"
            title={isInputDisabled ? "Start the task to log progress" : ""}
          />
          <button type="submit" className={`text-blue-500 hover:text-blue-700 transition ${isInputDisabled ? 'text-gray-400 cursor-not-allowed' : ''}`} disabled={isInputDisabled}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      ) : (
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-gray-900">{achievement.value}</span>
          <div className="flex gap-1">
            <button onClick={() => setIsEditing(true)} className="p-1 text-gray-500 hover:text-gray-700 transition">
              {icons.edit}
            </button>
            <button onClick={handleDeleteAchievement} className="p-1 text-red-500 hover:text-red-700 transition">
              {icons.delete}
            </button>
          </div>
        </div>
      )}

      {/* Check-in/out and Duration Display */}
      <div className="mt-4 pt-2 border-t border-gray-200">
        {!checkIn && isToday && !isInputDisabled && (
          <button
            onClick={handleCheckIn}
            className="w-full bg-blue-500 text-white rounded-md py-2 text-sm font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
          >
            {icons.checkin} Check In
          </button>
        )}
        {checkIn && !checkOut && isToday && (
          <button
            onClick={handleCheckOut}
            className="w-full bg-red-500 text-white rounded-md py-2 text-sm font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
          >
            {icons.checkout} Check Out
          </button>
        )}
        {(checkIn || checkOut) && (
          <div className="space-y-2 mt-2">
            {checkIn && (
              <div className="text-xs text-gray-700 flex items-center gap-2">
                <span className="font-semibold">Check In:</span>
                <span>{formatTime(checkIn.timestamp)}</span>
              </div>
            )}
            {checkOut && (
              <div className="text-xs text-gray-700 flex items-center gap-2">
                <span className="font-semibold">Check Out:</span>
                <span>{formatTime(checkOut.timestamp)}</span>
              </div>
            )}
            {durationMs > 0 && (
              <>
                <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span>Duration:</span>
                  <span>{formatDuration(durationMs)}</span>
                </div>
                {overtimeMs > 0 && (
                  <div className="text-sm font-bold text-blue-600 flex items-center gap-2">
                    <span>Overtime:</span>
                    <span>{formatDuration(overtimeMs)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Media and Voice Note Tools */}
      {!!achievement && (
        <div className="mt-4 pt-2 border-t border-gray-200">
          {/* Media Section */}
          <div className="space-y-2">
            <h5 className="font-semibold text-xs text-gray-800">Media ({achievement.media?.length || 0})</h5>
            <div className="flex gap-2 items-center">
              <input
                id={`file-upload-${task.id}-${day.toISOString()}`}
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileUpload}
              />
              <label
                htmlFor={`file-upload-${task.id}-${day.toISOString()}`}
                className="w-1/2 p-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold text-center cursor-pointer hover:bg-blue-200 transition"
              >
                Upload File
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
                className="w-1/2 p-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-semibold text-center cursor-pointer hover:bg-purple-200 transition"
              >
                Capture
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {achievement.media?.map((media, index) => (
                <div key={index} className="relative group overflow-hidden rounded-lg shadow-md">
                  {media.type === 'image' ? (
                    <img src={media.url} alt={`media-${index}`} className="w-full h-auto object-cover" />
                  ) : (
                    <video src={media.url} controls className="w-full h-auto object-cover" />
                  )}
                  <button onClick={() => handleDeleteMedia(media)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {icons.delete}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Voice Notes Section */}
          <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
            <h5 className="font-semibold text-xs text-gray-800">Voice Notes ({achievement.voiceNotes?.length || 0})</h5>
            {isRecording && (
                <div className="p-2 border border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-center text-xs font-medium text-red-500 animate-pulse">Recording...</p>
                    <canvas ref={canvasRef} className="w-full h-8"></canvas>
                </div>
            )}
            <div className="flex justify-center gap-2">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                    >
                        {icons.mic}
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                    >
                        {icons.stop}
                    </button>
                )}
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {achievement.voiceNotes?.length > 0 ? (
                achievement.voiceNotes.map((note, index) => (
                  <div key={index} className="flex items-center gap-1 bg-gray-100 p-1 rounded-md text-sm border border-gray-200">
                    <button onClick={() => handlePlayPause(note.audioUrl, index)} className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition">
                        {currentlyPlaying === index ? icons.pause : icons.play}
                    </button>
                    <span className="flex-1 text-gray-800 truncate text-xs">Note {index + 1}</span>
                    <button onClick={() => handleDeleteNote(note)} className="p-1 text-red-500 hover:bg-gray-200 rounded-full transition">
                        {icons.delete}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-xs text-center">No notes.</p>
              )}
            </div>
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
}) {
  const datesInRange = useMemo(() => {
    return getDatesInRange(task.startDate, task.endDate);
  }, [task.startDate, task.endDate]);

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

    const status = task.actualEndDate
      ? 'Completed'
      : task.actualStartDate
        ? (today > new Date(task.endDate) ? 'Overdue' : 'In Progress')
        : (today > new Date(task.startDate) ? 'Pending (Overdue)' : 'Not Started');

    let riskLevel = 'low';
    if (status === 'Overdue' || status === 'Pending (Overdue)') {
      riskLevel = 'high';
    }

    return {
      ...task,
      status,
      riskLevel,
      progressPercent: roundedProgress,
      totalAchieved,
    };
  }, [task]);

  const isMissionComplete = useMemo(() => {
    if (!tasksWithDerivedData.totalTarget || tasksWithDerivedData.totalTarget === 0) {
      return true;
    }
    return tasksWithDerivedData.totalAchieved >= tasksWithDerivedData.totalTarget;
  }, [tasksWithDerivedData.totalAchieved, tasksWithDerivedData.totalTarget]);

  const handleStartTask = () => {
    const updatedTask = {
      ...task,
      status: 'in-progress',
      actualStartDate: new Date(),
      dailyAchievements: task.dailyAchievements || [],
      lastActivity: new Date()
    };
    updateTask(task.id, updatedTask);
  };

  const handleEndTask = () => {
    const updatedTask = {
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
      className={`relative rounded-xl border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden bg-white border-blue-500`}
    >
      <div
        onClick={() => toggleExpand(task.id)}
        className="relative p-5 flex justify-between items-center cursor-pointer bg-gray-50/50"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full border border-gray-300 bg-blue-500 text-white`}>
            {isExpanded ? icons.minus : icons.plus}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
            <p className={`text-sm font-medium ${statusColors[tasksWithDerivedData.status]}`}>{tasksWithDerivedData.status}</p>
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
            <div className="border-t border-gray-200 pt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p className="font-semibold text-gray-900">Dates:</p>
                  <p>Planned: {formatDate(task.startDate)} - {formatDate(task.endDate)}</p>
                  <p>Actual: {formatDate(task.actualStartDate)} - {formatDate(task.actualEndDate)}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Progress:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-gray-900 font-bold">{tasksWithDerivedData.progressPercent || 0}%</p>
                      <p className="text-xs text-gray-500">of {tasksWithDerivedData.totalTarget || 'N/A'}</p>
                    </div>
                    <div className="flex-grow bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full bg-blue-500`}
                        style={{ width: `${tasksWithDerivedData.progressPercent || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Details:</p>
                  <p>Priority: {task.priority}</p>
                  <p>Status: {task.status}</p>
                </div>
              </div>

              {/* Daily Achievement Grid */}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Daily Achievements:</h4>
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-2 rounded-full bg-gray-200 text-gray-600">
                    {icons.target}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {tasksWithDerivedData.totalAchieved || 0} / {tasksWithDerivedData.totalTarget || 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-60 overflow-y-auto pr-2">
                  {datesInRange.map((day, index) => (
                    <DailyAchievementCard
                      key={index}
                      task={tasksWithDerivedData}
                      day={day}
                      achievement={achievementsMap.get(day.toISOString().split('T')[0])}
                      updateTask={updateTask}
                      setModal={setModal}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleStartTask}
                  disabled={!!task.actualStartDate}
                  className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white font-bold disabled:bg-gray-300 disabled:text-gray-500"
                >
                  Start Task
                </button>
                <button
                  onClick={handleEndTask}
                  disabled={!task.actualStartDate || !!task.actualEndDate}
                  title={!task.actualStartDate ? "Start the task first" : task.actualEndDate ? "Task already ended" : "End task and record actual end date"}
                  className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white font-bold disabled:bg-gray-300 disabled:text-gray-500"
                >
                  End Task
                </button>
                <button
                  onClick={() => deleteTask(task)}
                  className="p-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition"
                >
                  {icons.delete}
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
  const { tasks, updateTask, deleteTask, logDailyAchievement, startTask, completeTask, calculateTaskProgress, getTaskRiskLevel, teams } = useData();
  const { user } = useAuth();
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [modal, setModal] = useState({ visible: false, message: '', onConfirm: null });

  // Enhance tasks with tracking data
  let userTasks = tasks;
  if (user?.role === 'member' && user?.teamId) {
    userTasks = tasks.filter(task => task.assignedToTeamId === user.teamId);
  }

  const enhancedTasks = userTasks.map(task => ({
    ...task,
    dailyAchievements: task.dailyAchievements || [],
    totalTarget: task.totalTarget || 100,
    plannedEffortHours: 8,
    actualEffortHours: 0,
    actualStartDate: task.actualStartDate || null,
    actualEndDate: task.actualEndDate || null,
    teamName: teams.find(t => t.id === task.assignedToTeamId)?.name || 'غير محدد',
  }));

  const handleUpdateTask = (taskId, updatedTask) => {
    // تحديث المهمة مع إعادة حساب التقدم
    const taskWithProgress = {
      ...updatedTask,
      progress: calculateTaskProgress(updatedTask),
      riskLevel: getTaskRiskLevel(updatedTask),
      lastActivity: new Date()
    };
    updateTask(taskId, updatedTask);
  };

  const handleDelete = (task) => {
    setModal({
      visible: true,
      message: `Are you sure you want to delete "${task.title}"?`,
      onConfirm: async () => {
        setModal({ visible: false, message: '' });
        deleteTask(task.id);
      },
    });
  };

  const toggleExpand = (id) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">متتبع تقدم المهام</h2>
        <p className="text-gray-600">تتبع التقدم اليومي وتسجيل الدخول والإنجازات لمهامك</p>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {enhancedTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            isExpanded={expandedTaskId === task.id}
            toggleExpand={toggleExpand}
            updateTask={handleUpdateTask}
            deleteTask={handleDelete}
            setModal={setModal}
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
                    onClick={() => setModal({ visible: false, message: '' })}
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={modal.onConfirm || (() => setModal({ visible: false, message: '' }))}
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