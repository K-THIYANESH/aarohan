import React from 'react';

export default function PipelineTracker({ currentStage }) {
  const stages = [
    { id: 'PENDING', label: 'AI Flagged' },
    { id: 'FIELD_ASSIGNED', label: 'Field Visit' },
    { id: 'FIELD_SUBMITTED', label: 'Field Report' },
    { id: 'BDO_REVIEW', label: 'BDO Review' },
    { id: 'COLLECTOR_REVIEW', label: 'Collector Review' },
    { id: 'SDMA_APPROVED', label: 'SDMA' },
    { id: 'ALERTS_FIRED', label: 'Alerts Sent' },
  ];

  const getStageIndex = (stage) => {
    switch (stage) {
      case 'PENDING': return 0;
      case 'FIELD_ASSIGNED': return 1;
      case 'FIELD_SUBMITTED': return 2;
      case 'BDO_REVIEW': return 3;
      case 'COLLECTOR_REVIEW': return 4;
      case 'SDMA_APPROVED': return 5;
      case 'ALERTS_FIRED': return 6;
      case 'REJECTED': return -1;
      case 'MORE_INFO_NEEDED': return -2;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  if (currentStage === 'REJECTED') {
    return (
      <span className="px-3 py-1 bg-[#333333] text-white text-xs font-bold rounded-full">
        Rejected
      </span>
    );
  }

  if (currentStage === 'MORE_INFO_NEEDED') {
    return (
      <span className="px-3 py-1 bg-[#F57C00] text-white text-xs font-bold rounded-full">
        More Info Needed
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 text-[11px] font-bold">
      {stages.map((stg, idx) => {
        const isActive = idx === currentIndex;
        const isPassed = idx < currentIndex;

        return (
          <React.Fragment key={stg.id}>
            <div
              className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#FF9933] text-white shadow-xs font-extrabold scale-105'
                  : isPassed
                  ? 'bg-[#138808] text-white font-semibold'
                  : 'bg-gray-200 text-gray-500 font-normal'
              }`}
            >
              {stg.label}
            </div>
            {idx < stages.length - 1 && (
              <span className="text-gray-400 font-bold text-[10px]">&gt;</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
