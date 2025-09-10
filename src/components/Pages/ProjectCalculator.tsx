import React, { useState } from 'react';

interface Stage {
  name: string;
  units: number;
  startDate: string;
  endDate: string;
  duration: number;
}

interface StageInput {
  name: string;
  units: number;
}

const ProjectCalculator: React.FC = () => {
  const [totalWork, setTotalWork] = useState('');
  const [stage1Units, setStage1Units] = useState('');
  const [stage2Units, setStage2Units] = useState('');
  const [stage3Units, setStage3Units] = useState('');
  const [stage4Units, setStage4Units] = useState('');
  const [teamRate, setTeamRate] = useState('');
  const [numberOfTeams, setNumberOfTeams] = useState('');
  const [startDate, setStartDate] = useState('');
  const [stagesResults, setStagesResults] = useState<Stage[]>([]);
  const [totalWorkText, setTotalWorkText] = useState('إجمالي عدد الخزائن: -');
  const [totalStartDateText, setTotalStartDateText] = useState('تاريخ بداية مرحلة التركيبات: -');
  const [totalDurationText, setTotalDurationText] = useState('المدة الكلية للمشروع: -');
  const [totalEndDateText, setTotalEndDateText] = useState('تاريخ الانتهاء الكلي: -');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const stageNames = ["المرحلة الأولى", "المرحلة الثانية", "المرحلة الثالثة", "المرحلة الرابعة"];
  const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const showModalAlert = (message: string) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const getNextWorkday = (date: Date): Date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    while (nextDay.getDay() === 5) { // 5 is Friday
      nextDay.setDate(nextDay.getDate() + 1);
    }
    return nextDay;
  };

  const calculateStages = () => {
    const totalWorkNum = parseFloat(totalWork);
    const teamRateNum = parseFloat(teamRate);
    const numberOfTeamsNum = parseFloat(numberOfTeams);

    // Basic input validation
    if (isNaN(teamRateNum) || isNaN(numberOfTeamsNum) || teamRateNum <= 0 || numberOfTeamsNum <= 0 || !startDate) {
      showModalAlert('الرجاء إدخال أرقام صحيحة وموجبة وتاريخ بداية في جميع الحقول.');
      return;
    }

    const initialStartDate = new Date(startDate);
    if (isNaN(initialStartDate.getTime())) {
      showModalAlert('تاريخ البداية غير صحيح. الرجاء إدخال تاريخ صحيح.');
      return;
    }

    // Determine if individual stage units are provided
    const hasManualStageUnits = [stage1Units, stage2Units, stage3Units, stage4Units].some(val => val !== '');
    let stages: StageInput[] = [];
    const totalDailyRate = teamRateNum * numberOfTeamsNum;

    // Logic to handle different input scenarios
    if (hasManualStageUnits) {
      // Use manually entered stage units
      stages = stageNames.map((name, index) => ({
        name: name,
        units: parseFloat([stage1Units, stage2Units, stage3Units, stage4Units][index]) || 0
      }));
    } else if (!isNaN(totalWorkNum) && totalWorkNum > 0) {
      // Distribute total work if no stage units are specified
      const unitsPerStage = Math.floor(totalWorkNum / 4);
      const remainder = totalWorkNum % 4;
      stages = [
        { name: "المرحلة الأولى", units: unitsPerStage },
        { name: "المرحلة الثانية", units: unitsPerStage },
        { name: "المرحلة الثالثة", units: unitsPerStage },
        { name: "المرحلة الرابعة", units: unitsPerStage + remainder }
      ];
    } else {
      showModalAlert('الرجاء إدخال إجمالي عدد الخزائن أو عدد الخزائن لكل مرحلة.');
      return;
    }

    // Clear previous results and set up timeline structure
    const results: Stage[] = [];

    let currentStartDate = new Date(startDate);
    let totalCalendarDays = 0;
    let projectEndDate: Date | undefined = undefined;

    stages.forEach(stage => {
      if (stage.units <= 0) {
        // Skip stages with 0 units for the timeline view
        return;
      }

      // Calculate workdays needed for the current stage
      const workDaysNeeded = Math.ceil(stage.units / totalDailyRate);
      let stageCalendarDays = 0;
      const endDate = new Date(currentStartDate.getTime());

      // Loop to find the end date by skipping Fridays
      let daysAdded = 0;
      while (daysAdded < workDaysNeeded) {
        if (endDate.getDay() !== 5) { // 5 is Friday
          daysAdded++;
        }
        if (daysAdded < workDaysNeeded) {
          endDate.setDate(endDate.getDate() + 1);
        }
        stageCalendarDays++;
      }

      // Ensure end date is not a Friday
      while (endDate.getDay() === 5) {
        endDate.setDate(endDate.getDate() + 1);
        stageCalendarDays++;
      }

      // Format the dates
      const formattedStartDate = `${daysOfWeek[currentStartDate.getDay()]}، ${currentStartDate.toLocaleDateString('ar-EG')}`;
      const formattedEndDate = `${daysOfWeek[endDate.getDay()]}، ${endDate.toLocaleDateString('ar-EG')}`;

      results.push({
        name: stage.name,
        units: stage.units,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        duration: stageCalendarDays
      });

      totalCalendarDays += stageCalendarDays;
      projectEndDate = endDate;
      // Set the start date for the next stage to the next workday after the current stage's end date
      currentStartDate = getNextWorkday(endDate);
    });

    setStagesResults(results);

    // Update overall project summary
    if (projectEndDate) {
      // Check if totalWork is a valid number before displaying
      if (!isNaN(totalWorkNum) && totalWorkNum > 0) {
        setTotalWorkText(`إجمالي عدد الخزائن: ${totalWorkNum}`);
      } else {
        setTotalWorkText('إجمالي عدد الخزائن: -');
      }

      const formattedProjectStartDate = `${daysOfWeek[initialStartDate.getDay()]}، ${initialStartDate.toLocaleDateString('ar-EG')}`;
      setTotalStartDateText(`تاريخ بداية مرحلة التركيبات: ${formattedProjectStartDate}`);

      setTotalDurationText(`المدة الكلية للمشروع: ${totalCalendarDays} يوم`);
      const formattedProjectEndDate = `${daysOfWeek[(projectEndDate as Date).getDay()]}، ${(projectEndDate as Date).toLocaleDateString('ar-EG')}`;
      setTotalEndDateText(`تاريخ الانتهاء الكلي: ${formattedProjectEndDate}`);
    }
  };

  const handlePrint = () => {
    if (stagesResults.length === 0) {
      showModalAlert('لا توجد نتائج لعرضها. الرجاء حساب المراحل أولاً.');
      return;
    }

    const stagesHTML = stagesResults.map(stage => `
      <tr>
        <td class="px-4 py-2 border border-gray-300 font-semibold">${stage.name}</td>
        <td class="px-4 py-2 border border-gray-300 text-center">${stage.units}</td>
        <td class="px-4 py-2 border border-gray-300 text-center">${stage.startDate}</td>
        <td class="px-4 py-2 border border-gray-300 text-center">${stage.endDate}</td>
        <td class="px-4 py-2 border border-gray-300 text-center">${stage.duration} يوم</td>
      </tr>
    `).join('');

    const printTitle = 'تقرير حاسبة مدة إنجاز ورش التركيب';
    const printContentHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${printTitle}</title>
        <style>
          @page { size: auto; margin: 0; }
          body {
            font-family: 'Inter', sans-serif;
            direction: rtl;
            margin: 0;
            padding: 2cm;
            color: #000;
            background-color: #fff;
            font-size: 12px;
          }
          .report-header {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 24px;
            color: #5f979d;
          }
          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .report-table th, .report-table td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: center;
          }
          .report-table th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          .summary-box {
            text-align: center;
            padding-top: 20px;
            margin-top: 30px;
            border-top: 2px solid #5f979d;
          }
          .summary-box p {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
          }
          .print-date {
            text-align: center;
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="report-header">${printTitle}</div>
        <div class="print-date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</div>
        <table class="report-table">
          <thead>
            <tr>
              <th>المرحلة</th>
              <th>عدد الخزائن</th>
              <th>تاريخ البداية</th>
              <th>تاريخ الانتهاء</th>
              <th>المدة</th>
            </tr>
          </thead>
          <tbody>
            ${stagesHTML}
          </tbody>
        </table>
        <div class="summary-box">
          <p>${totalWorkText}</p>
          <p>${totalStartDateText}</p>
          <p>${totalDurationText}</p>
          <p>${totalEndDateText}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(printContentHTML);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      showModalAlert('تعذر فتح نافذة الطباعة. الرجاء السماح بالنوافذ المنبثقة.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-soft border border-primary-200/30 p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              حاسبة مدة إنجاز ورش التركيب
            </h1>
            <p className="text-gray-600 mt-2">
              أدخل تفاصيل المشروع لحساب المدة الزمنية لكل مرحلة وتاريخ الانتهاء.
            </p>
          </div>
        </div>

        {/* Main calculator container */}
        <div className="bg-white shadow-2xl rounded-3xl p-8 md:p-12 w-full border-t-8 border-primary-600 transform transition-all duration-500 hover:scale-105">
          {/* Main content area with two columns for larger screens */}
          <div className="lg:flex lg:flex-row-reverse lg:gap-12">
            {/* Input fields section (right column on larger screens) */}
            <div className="space-y-6 lg:w-1/2">
              <div>
                <label htmlFor="totalWork" className="block text-sm font-semibold mb-2">
                  إجمالي عدد الخزائن للمشروع
                </label>
                <input
                  type="number"
                  id="totalWork"
                  placeholder="مثال: 140"
                  value={totalWork}
                  onChange={(e) => setTotalWork(e.target.value)}
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-200 bg-gray-50 text-gray-900 transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="stage1Units" className="block text-sm font-semibold mb-2">
                    خزائن المرحلة الأولى
                  </label>
                  <input
                    type="number"
                    id="stage1Units"
                    placeholder="اتركه فارغاً للتوزيع التلقائي"
                    value={stage1Units}
                    onChange={(e) => setStage1Units(e.target.value)}
                    className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-200 bg-gray-50 text-gray-900 transition-all duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="stage2Units" className="block text-sm font-semibold mb-2">
                    خزائن المرحلة الثانية
                  </label>
                  <input
                    type="number"
                    id="stage2Units"
                    placeholder="اتركه فارغاً للتوزيع التلقائي"
                    value={stage2Units}
                    onChange={(e) => setStage2Units(e.target.value)}
                    className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-200 bg-gray-50 text-gray-900 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="stage3Units" className="block text-sm font-semibold mb-2">
                    خزائن المرحلة الثالثة
                  </label>
                  <input
                    type="number"
                    id="stage3Units"
                    placeholder="اتركه فارغاً للتوزيع التلقائي"
                    value={stage3Units}
                    onChange={(e) => setStage3Units(e.target.value)}
                    className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-200 bg-gray-50 text-gray-900 transition-all duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="stage4Units" className="block text-sm font-semibold mb-2">
                    خزائن المرحلة الرابعة
                  </label>
                  <input
                    type="number"
                    id="stage4Units"
                    placeholder="اتركه فارغاً للتوزيع التلقائي"
                    value={stage4Units}
                    onChange={(e) => setStage4Units(e.target.value)}
                    className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-200 bg-gray-50 text-gray-900 transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="teamRate" className="block text-sm font-semibold mb-2">
                  معدل إنجاز الفريق في اليوم (مثلاً: خزائن/يوم)
                </label>
                <input
                  type="number"
                  id="teamRate"
                  placeholder="أدخل معدل الإنجاز اليومي للفريق"
                  value={teamRate}
                  onChange={(e) => setTeamRate(e.target.value)}
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-200 bg-gray-50 text-gray-900 transition-all duration-300"
                />
              </div>

              <div>
                <label htmlFor="numberOfTeams" className="block text-sm font-semibold mb-2">
                  عدد فرق التركيب
                </label>
                <input
                  type="number"
                  id="numberOfTeams"
                  placeholder="أدخل عدد الفرق"
                  value={numberOfTeams}
                  onChange={(e) => setNumberOfTeams(e.target.value)}
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-200 bg-gray-50 text-gray-900 transition-all duration-300"
                />
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-semibold mb-2">
                  تاريخ بداية المرحلة الأولى
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pr-12 px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-200 bg-gray-50 text-gray-900 transition-all duration-300"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Calculation button */}
              <button
                onClick={calculateStages}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-200"
              >
                احسب مدة المراحل
              </button>
            </div>

            {/* Result display section (left column on larger screens) */}
            <div className="mt-8 lg:mt-0 lg:w-1/2 text-center p-6 bg-primary-50 rounded-2xl border-2 border-dashed border-primary-200">
              <p className="text-xl md:text-2xl font-bold text-gray-700 mb-4">
                نتائج المراحل
              </p>
              <div className="text-right space-y-4">
                {stagesResults.length === 0 ? (
                  <p>سيتم عرض نتائج المراحل هنا.</p>
                ) : (
                  stagesResults.map((stage, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl shadow-inner border border-gray-200 transition-all duration-300 hover:scale-102">
                      <h3 className="font-bold text-lg mb-2 text-primary-600">{stage.name}</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm0 2h8v12H6V4zm2 2a1 1 0 000 2h4a1 1 0 100-2H8z"></path>
                          </svg>
                          <span><strong>عدد الخزائن:</strong> {stage.units}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                          </svg>
                          <span><strong>تاريخ البداية:</strong> {stage.startDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                          </svg>
                          <span><strong>تاريخ الانتهاء:</strong> {stage.endDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 6.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm.75 0a.75.75 0 100-1.5.75.75 0 000 1.5z"></path>
                            <path fillRule="evenodd" d="M16 1a1 1 0 00-1 1v1H5V2a1 1 0 10-2 0v1H2a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-1V2a1 1 0 00-1-1zm-1 4H3a1 1 0 00-1 1v8a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1zm-5 4a1 1 0 000 2h4a1 1 0 100-2h-4z" clipRule="evenodd"></path>
                          </svg>
                          <span><strong>المدة:</strong> {stage.duration} يوم</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <hr className="my-6 border-gray-300" />

              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold text-gray-700 mb-2">
                  تقرير إجمالي عن المشروع
                </p>
                <p className="text-lg font-medium text-gray-600 mb-2">
                  {totalWorkText}
                </p>
                <p className="text-lg font-medium text-gray-600 mb-2">
                  {totalStartDateText}
                </p>
                <p className="text-lg font-medium text-gray-600 mb-2">
                  {totalDurationText}
                </p>
                <p className="text-lg font-medium text-gray-600 mb-2">
                  {totalEndDateText}
                </p>
              </div>

              <p className="text-sm font-light text-gray-500 mt-4">
                ملاحظة: الحساب يستثني أيام الجمعة كإجازة أسبوعية.
              </p>

              {/* Print button */}
              <button
                onClick={handlePrint}
                className="mt-6 w-full bg-gray-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:bg-gray-600 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-400"
              >
                طباعة النتائج
              </button>
            </div>
          </div>

          {/* Custom modal for alerts */}
          {showModal && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-80 text-center space-y-4">
                <p className="text-lg font-semibold text-gray-900">{modalMessage}</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-red-500 text-white font-bold py-2 rounded-xl hover:bg-red-600 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCalculator;