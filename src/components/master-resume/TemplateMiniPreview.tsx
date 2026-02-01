"use client";

interface TemplateMiniPreviewProps {
  templateId: string;
  accentColor: string;
}

// Abstract line component for text representation
const TextLine = ({ width = "100%", height = 4, className = "", style }: { width?: string | number; height?: number; className?: string; style?: React.CSSProperties }) => (
  <div
    className={`bg-gray-300 rounded-sm ${className}`}
    style={{ width: typeof width === 'number' ? `${width}%` : width, height, ...style }}
  />
);

// Bullet point with line
const BulletLine = ({ bulletStyle, accentColor, width = 85 }: { bulletStyle: string; accentColor: string; width?: number }) => (
  <div className="flex items-center gap-1">
    <span style={{ color: accentColor, fontSize: 6, lineHeight: 1 }}>{bulletStyle}</span>
    <TextLine width={width} height={3} />
  </div>
);

export default function TemplateMiniPreview({ templateId, accentColor }: TemplateMiniPreviewProps) {
  switch (templateId) {
    case "executive":
      return <ExecutivePreview accentColor={accentColor} />;
    case "horizon":
      return <HorizonPreview accentColor={accentColor} />;
    case "canvas":
      return <CanvasPreview accentColor={accentColor} />;
    case "terminal":
      return <TerminalPreview accentColor={accentColor} />;
    case "summit":
      return <SummitPreview accentColor={accentColor} />;
    case "cornerstone":
      return <CornerstonePreview accentColor={accentColor} />;
    default:
      return <ExecutivePreview accentColor={accentColor} />;
  }
}

// Executive: Single column, centered header, serif style
function ExecutivePreview({ accentColor }: { accentColor: string }) {
  return (
    <div className="w-full h-full bg-white rounded-sm p-2 flex flex-col" style={{ aspectRatio: "8.5/11" }}>
      {/* Centered header with accent bottom border */}
      <div className="flex flex-col items-center pb-2 mb-2" style={{ borderBottom: `2px solid ${accentColor}` }}>
        <TextLine width={60} height={6} className="mb-1" />
        <TextLine width={40} height={3} />
      </div>

      {/* Contact info centered */}
      <div className="flex justify-center gap-2 mb-2">
        <TextLine width={20} height={2} />
        <TextLine width={25} height={2} />
        <TextLine width={20} height={2} />
      </div>

      {/* Summary section */}
      <div className="mb-2">
        <TextLine width={30} height={4} className="mb-1" style={{ borderBottom: `1px solid ${accentColor}` } } />
        <TextLine width="100%" height={2} className="mb-0.5" />
        <TextLine width={90} height={2} />
      </div>

      {/* Experience section */}
      <div className="mb-2 flex-1">
        <div className="mb-1" style={{ borderBottom: `1px solid ${accentColor}`, paddingBottom: 2 }}>
          <TextLine width={35} height={4} />
        </div>
        <div className="mb-1">
          <TextLine width={50} height={3} className="mb-0.5" />
          <div className="space-y-0.5 ml-1">
            <BulletLine bulletStyle="▸" accentColor={accentColor} width={90} />
            <BulletLine bulletStyle="▸" accentColor={accentColor} width={85} />
            <BulletLine bulletStyle="▸" accentColor={accentColor} width={88} />
          </div>
        </div>
      </div>

      {/* Education section */}
      <div>
        <div className="mb-1" style={{ borderBottom: `1px solid ${accentColor}`, paddingBottom: 2 }}>
          <TextLine width={25} height={4} />
        </div>
        <TextLine width={55} height={3} />
      </div>
    </div>
  );
}

// Horizon: Two-column with left sidebar
function HorizonPreview({ accentColor }: { accentColor: string }) {
  const sidebarBg = accentColor + "1A"; // 10% opacity

  return (
    <div className="w-full h-full bg-white rounded-sm flex overflow-hidden" style={{ aspectRatio: "8.5/11" }}>
      {/* Left sidebar */}
      <div className="w-[35%] p-1.5 flex flex-col" style={{ backgroundColor: sidebarBg }}>
        {/* Photo placeholder */}
        <div
          className="w-8 h-8 rounded-full mx-auto mb-1.5 bg-gray-300"
          style={{ border: `2px solid ${accentColor}` }}
        />

        {/* Contact section */}
        <div className="mb-2">
          <TextLine width="100%" height={2} className="mb-0.5" />
          <TextLine width={80} height={2} className="mb-0.5" />
          <TextLine width={70} height={2} />
        </div>

        {/* Skills section */}
        <div className="mb-2">
          <TextLine width={60} height={3} className="mb-1" style={{ borderTop: `2px solid ${accentColor}`, paddingTop: 2 } } />
          <div className="space-y-1">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "80%", backgroundColor: accentColor }} />
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "65%", backgroundColor: accentColor }} />
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "90%", backgroundColor: accentColor }} />
            </div>
          </div>
        </div>

        {/* Education */}
        <div>
          <TextLine width={70} height={3} className="mb-1" style={{ borderTop: `2px solid ${accentColor}`, paddingTop: 2 } } />
          <TextLine width="100%" height={2} className="mb-0.5" />
          <TextLine width={80} height={2} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-2">
        {/* Header */}
        <div className="mb-2">
          <TextLine width={70} height={7} className="mb-1" />
          <TextLine width={45} height={3} />
        </div>

        {/* Experience */}
        <div className="mb-2">
          <TextLine width={40} height={4} className="mb-1" style={{ borderTop: `2px solid ${accentColor}`, paddingTop: 2 } } />
          <TextLine width={55} height={3} className="mb-0.5" />
          <div className="space-y-0.5 ml-1">
            <BulletLine bulletStyle="●" accentColor={accentColor} width={95} />
            <BulletLine bulletStyle="●" accentColor={accentColor} width={90} />
            <BulletLine bulletStyle="●" accentColor={accentColor} width={88} />
          </div>
        </div>

        <div>
          <TextLine width={50} height={3} className="mb-0.5" />
          <div className="space-y-0.5 ml-1">
            <BulletLine bulletStyle="●" accentColor={accentColor} width={92} />
            <BulletLine bulletStyle="●" accentColor={accentColor} width={85} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Canvas: Two-column with right dark sidebar, timeline style
function CanvasPreview({ accentColor }: { accentColor: string }) {
  return (
    <div className="w-full h-full bg-white rounded-sm flex overflow-hidden" style={{ aspectRatio: "8.5/11" }}>
      {/* Main content with timeline */}
      <div className="flex-1 p-2">
        {/* Header with accent underline */}
        <div className="mb-2">
          <TextLine width={65} height={8} className="mb-0.5" />
          <div className="h-1 w-12 rounded-sm mb-1" style={{ backgroundColor: accentColor }} />
          <TextLine width={35} height={3} className="italic" />
        </div>

        {/* Summary with left border */}
        <div className="mb-2 pl-1.5" style={{ borderLeft: `2px solid ${accentColor}` }}>
          <TextLine width="100%" height={2} className="mb-0.5" />
          <TextLine width={85} height={2} />
        </div>

        {/* Timeline experience */}
        <div className="relative">
          <TextLine width={40} height={4} className="mb-1.5" />

          {/* Timeline items */}
          <div className="relative pl-3">
            {/* Timeline line */}
            <div className="absolute left-1 top-1 bottom-1 w-px bg-gray-300" />

            {/* Timeline dot 1 */}
            <div className="relative mb-2">
              <div
                className="absolute -left-2.5 top-0.5 w-2 h-2 rounded-full border-2 bg-white"
                style={{ borderColor: accentColor }}
              />
              <TextLine width={60} height={3} className="mb-0.5" />
              <div className="space-y-0.5">
                <BulletLine bulletStyle="—" accentColor={accentColor} width={90} />
                <BulletLine bulletStyle="—" accentColor={accentColor} width={85} />
              </div>
            </div>

            {/* Timeline dot 2 */}
            <div className="relative">
              <div
                className="absolute -left-2.5 top-0.5 w-2 h-2 rounded-full border-2 bg-white"
                style={{ borderColor: accentColor }}
              />
              <TextLine width={55} height={3} className="mb-0.5" />
              <div className="space-y-0.5">
                <BulletLine bulletStyle="—" accentColor={accentColor} width={88} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right dark sidebar */}
      <div className="w-[32%] p-1.5 flex flex-col" style={{ backgroundColor: "#1a1a1a" }}>
        {/* Photo placeholder */}
        <div
          className="w-8 h-8 mx-auto mb-1.5 bg-gray-600 rounded-sm"
          style={{ border: `2px solid ${accentColor}` }}
        />

        {/* Contact section */}
        <div className="mb-2">
          <div className="h-0.5 w-full bg-gray-600 mb-1" />
          <TextLine width="100%" height={2} className="mb-0.5 !bg-gray-500" />
          <TextLine width={80} height={2} className="!bg-gray-500" />
        </div>

        {/* Skills as chips */}
        <div className="mb-2">
          <div className="h-0.5 w-full bg-gray-600 mb-1" />
          <div className="flex flex-wrap gap-0.5">
            <div className="px-1 py-0.5 rounded-sm border border-gray-500">
              <TextLine width={16} height={2} className="!bg-gray-400" />
            </div>
            <div className="px-1 py-0.5 rounded-sm border border-gray-500">
              <TextLine width={14} height={2} className="!bg-gray-400" />
            </div>
            <div className="px-1 py-0.5 rounded-sm border border-gray-500">
              <TextLine width={12} height={2} className="!bg-gray-400" />
            </div>
          </div>
        </div>

        {/* Education */}
        <div>
          <div className="h-0.5 w-full bg-gray-600 mb-1" />
          <TextLine width="100%" height={2} className="mb-0.5 !bg-gray-500" />
          <TextLine width={70} height={2} className="!bg-gray-500" />
        </div>
      </div>
    </div>
  );
}

// Terminal: Single column, code/CLI style
function TerminalPreview({ accentColor }: { accentColor: string }) {
  return (
    <div className="w-full h-full bg-white rounded-sm p-2 flex flex-col font-mono" style={{ aspectRatio: "8.5/11" }}>
      {/* Code-style header */}
      <div className="mb-2">
        <div className="text-[5px] text-gray-400 mb-0.5">/* Resume v1.0 */</div>
        <TextLine width={55} height={6} className="mb-0.5" />
        <div className="flex items-center gap-0.5">
          <span className="text-[5px]" style={{ color: accentColor }}>$ whoami →</span>
          <TextLine width={35} height={3} />
        </div>
      </div>

      {/* Contact with code icons */}
      <div className="flex gap-2 mb-2 text-[4px] text-gray-500">
        <span>[mail]</span>
        <span>[tel]</span>
        <span>[loc]</span>
      </div>

      {/* README section */}
      <div className="mb-2 p-1 rounded-sm" style={{ backgroundColor: accentColor + "15" }}>
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-[5px]" style={{ color: accentColor }}>##</span>
          <TextLine width={25} height={3} />
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <TextLine width="100%" height={2} className="mb-0.5" />
        <TextLine width={85} height={2} />
      </div>

      {/* Experience section */}
      <div className="mb-2 flex-1">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[5px]" style={{ color: accentColor }}>##</span>
          <TextLine width={30} height={3} />
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="mb-1.5">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[5px]" style={{ color: accentColor }}>@</span>
            <TextLine width={40} height={3} />
            <span className="text-[4px] text-gray-400">// 2022-present</span>
          </div>
          <div className="space-y-0.5 ml-1">
            <div className="flex items-center gap-0.5">
              <span className="text-[5px]" style={{ color: accentColor }}>&gt;</span>
              <TextLine width={90} height={2} />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[5px]" style={{ color: accentColor }}>&gt;</span>
              <TextLine width={85} height={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack section */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[5px]" style={{ color: accentColor }}>##</span>
          <TextLine width={28} height={3} />
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex items-center gap-1 text-[5px]">
          <TextLine width={20} height={2} />
          <span style={{ color: accentColor }}>████</span>
          <span className="text-gray-300">░░</span>
        </div>
      </div>
    </div>
  );
}

// Summit: Single column, centered formal header, C-suite elegance
function SummitPreview({ accentColor }: { accentColor: string }) {
  return (
    <div className="w-full h-full bg-white rounded-sm p-2 flex flex-col" style={{ aspectRatio: "8.5/11" }}>
      {/* Formal centered header */}
      <div className="flex flex-col items-center pb-2 mb-2" style={{ borderBottom: `2px double ${accentColor}` }}>
        {/* Photo placeholder */}
        <div className="w-6 h-6 rounded-full bg-gray-300 mb-1" />
        <TextLine width={55} height={7} className="mb-0.5 tracking-widest" />
        <TextLine width={35} height={3} />
      </div>

      {/* Centered contact */}
      <div className="flex justify-center items-center gap-1 mb-2 text-[4px] text-gray-400">
        <TextLine width={18} height={2} />
        <span>·</span>
        <TextLine width={22} height={2} />
        <span>·</span>
        <TextLine width={20} height={2} />
      </div>

      {/* Executive Profile section - centered title with lines */}
      <div className="mb-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-px" style={{ backgroundColor: accentColor }} />
          <TextLine width={40} height={3} />
          <div className="w-8 h-px" style={{ backgroundColor: accentColor }} />
        </div>
        <div className="text-center">
          <TextLine width={90} height={2} className="mx-auto mb-0.5" />
          <TextLine width={80} height={2} className="mx-auto" />
        </div>
      </div>

      {/* Professional Experience section */}
      <div className="mb-2 flex-1">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-6 h-px" style={{ backgroundColor: accentColor }} />
          <TextLine width={50} height={3} />
          <div className="w-6 h-px" style={{ backgroundColor: accentColor }} />
        </div>
        <div className="mb-1">
          <TextLine width={50} height={3} className="mb-0.5" />
          <div className="space-y-0.5 ml-1">
            <BulletLine bulletStyle="◆" accentColor={accentColor} width={92} />
            <BulletLine bulletStyle="◆" accentColor={accentColor} width={88} />
            <BulletLine bulletStyle="◆" accentColor={accentColor} width={90} />
          </div>
        </div>
      </div>

      {/* Areas of Expertise */}
      <div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-6 h-px" style={{ backgroundColor: accentColor }} />
          <TextLine width={40} height={3} />
          <div className="w-6 h-px" style={{ backgroundColor: accentColor }} />
        </div>
        <div className="flex justify-center">
          <TextLine width={70} height={2} />
        </div>
      </div>

      {/* Footer symbol */}
      <div className="text-center mt-1 text-[6px]" style={{ color: accentColor }}>❖</div>
    </div>
  );
}

// Cornerstone: Two-column with left gradient sidebar
function CornerstonePreview({ accentColor }: { accentColor: string }) {
  return (
    <div className="w-full h-full bg-white rounded-sm flex overflow-hidden" style={{ aspectRatio: "8.5/11" }}>
      {/* Left gradient sidebar */}
      <div
        className="w-[38%] p-1.5 flex flex-col text-white"
        style={{
          background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}DD 100%)`
        }}
      >
        {/* Photo placeholder */}
        <div className="w-9 h-9 mx-auto mb-1.5 bg-white/30 rounded-sm" />

        {/* Name in sidebar */}
        <div className="text-center mb-2">
          <TextLine width={80} height={4} className="mx-auto mb-0.5 !bg-white/80" />
          <TextLine width={60} height={2} className="mx-auto !bg-white/60" />
        </div>

        {/* Contact section */}
        <div className="mb-2">
          <TextLine width={50} height={3} className="mb-1 !bg-white/70" />
          <div className="space-y-0.5">
            <TextLine width="100%" height={2} className="!bg-white/50" />
            <TextLine width={80} height={2} className="!bg-white/50" />
            <TextLine width={90} height={2} className="!bg-white/50" />
          </div>
        </div>

        {/* Skills section */}
        <div className="mb-2">
          <TextLine width={40} height={3} className="mb-1 !bg-white/70" />
          <div className="space-y-1">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-white/80" style={{ width: "85%" }} />
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-white/80" style={{ width: "70%" }} />
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-white/80" style={{ width: "90%" }} />
            </div>
          </div>
        </div>

        {/* Education */}
        <div>
          <TextLine width={55} height={3} className="mb-1 !bg-white/70" />
          <TextLine width="100%" height={2} className="mb-0.5 !bg-white/50" />
          <TextLine width={70} height={2} className="!bg-white/50" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-2">
        {/* Header */}
        <div className="mb-2">
          <TextLine width={75} height={7} className="mb-0.5" />
          <TextLine width={40} height={3} style={{ backgroundColor: accentColor + "60" } } />
        </div>

        {/* Experience */}
        <div className="mb-2">
          <div className="mb-1 pb-0.5" style={{ borderBottom: `2px solid ${accentColor}` }}>
            <TextLine width={40} height={4} />
          </div>
          <TextLine width={55} height={3} className="mb-0.5" />
          <div className="space-y-0.5 ml-1">
            <BulletLine bulletStyle="■" accentColor={accentColor} width={95} />
            <BulletLine bulletStyle="■" accentColor={accentColor} width={88} />
            <BulletLine bulletStyle="■" accentColor={accentColor} width={92} />
          </div>
        </div>

        <div>
          <TextLine width={50} height={3} className="mb-0.5" />
          <div className="space-y-0.5 ml-1">
            <BulletLine bulletStyle="■" accentColor={accentColor} width={90} />
            <BulletLine bulletStyle="■" accentColor={accentColor} width={85} />
          </div>
        </div>
      </div>
    </div>
  );
}
