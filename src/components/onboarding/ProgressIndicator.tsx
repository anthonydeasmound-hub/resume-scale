"use client";

interface ProgressIndicatorProps {
  stepLabels: string[];
  currentStepNumber: number;
}

export default function ProgressIndicator({ stepLabels, currentStepNumber }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center mb-6 overflow-x-auto pb-2">
      {stepLabels.map((label, idx) => {
        const stepNum = idx + 1;
        const isComplete = currentStepNumber > stepNum;
        const isCurrent = currentStepNumber === stepNum;

        return (
          <div key={label} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                  isComplete
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-brand-gold text-gray-900 ring-4 ring-blue-100"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isComplete ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : stepNum}
              </div>
              <span className={`text-xs mt-1.5 whitespace-nowrap ${isCurrent ? "text-brand-blue font-medium" : "text-gray-500"}`}>
                {label}
              </span>
            </div>
            {idx < stepLabels.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 min-w-4 transition-colors duration-300 ${
                  isComplete ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
