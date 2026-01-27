import { ResumeData } from '@/types/resume';

// Template options that users can toggle
export interface TemplateOptions {
  showPhoto: boolean;
  showSkillBars: boolean;
  showIcons: boolean;
  accentColor: string;
}

// Template metadata
export interface TemplateMetadata {
  id: string;
  name: string;
  category: 'professional' | 'modern' | 'creative' | 'technical' | 'executive';
  layout: 'single' | 'two-column-left' | 'two-column-right';
  description: string;
  supportsPhoto: boolean;
  supportsSkillBars: boolean;
  supportsIcons: boolean;
}

// Template generator function type
export type TemplateGenerator = (data: ResumeData, options: TemplateOptions) => string;

// Import all templates
import { generateExecutiveHTML, executiveMetadata } from './executive';
import { generateHorizonHTML, horizonMetadata } from './horizon';
import { generateCanvasHTML, canvasMetadata } from './canvas';
import { generateTerminalHTML, terminalMetadata } from './terminal';
import { generateSummitHTML, summitMetadata } from './summit';
import { generateCornerstoneHTML, cornerstoneMetadata } from './cornerstone';

// Template registry
export const TEMPLATE_REGISTRY: Record<string, {
  metadata: TemplateMetadata;
  generate: TemplateGenerator;
}> = {
  executive: { metadata: executiveMetadata, generate: generateExecutiveHTML },
  horizon: { metadata: horizonMetadata, generate: generateHorizonHTML },
  canvas: { metadata: canvasMetadata, generate: generateCanvasHTML },
  terminal: { metadata: terminalMetadata, generate: generateTerminalHTML },
  summit: { metadata: summitMetadata, generate: generateSummitHTML },
  cornerstone: { metadata: cornerstoneMetadata, generate: generateCornerstoneHTML },
};

// Get all template metadata for display
export function getAllTemplates(): TemplateMetadata[] {
  return Object.values(TEMPLATE_REGISTRY).map(t => t.metadata);
}

// Get templates by category
export function getTemplatesByCategory(category: string): TemplateMetadata[] {
  if (category === 'all') return getAllTemplates();
  return getAllTemplates().filter(t => t.category === category);
}

// ---------------------------------------------------------------------------
// Density tier CSS overrides — injected after each template's own styles.
//
// Normal: the template's default values (no overrides needed).
// Compact: reduces padding, margins, line-heights, and font sizes moderately.
// Dense: reduces more aggressively while keeping body text >= 8pt.
//
// Covers both single-column (.page > .header/.section) and two-column
// (.page > .sidebar + .main) layouts used across all 6 templates.
// ---------------------------------------------------------------------------
const DENSITY_TIER_CSS = `
    /* ===== Compact tier ===== */
    .page.compact {
      padding: 0.4in 0.55in;
    }
    .page.compact .sidebar { padding: 0.35in 0.25in; }
    .page.compact .main { padding: 0.35in 0.4in 0.35in 0.3in; }

    .page.compact .header { margin-bottom: 14px; padding-bottom: 10px; }
    .page.compact .main-header { margin-bottom: 14px; }
    .page.compact .name, .page.compact .main-name { font-size: 24pt; margin-bottom: 4px; }
    .page.compact .sidebar-name { font-size: 16pt; margin-bottom: 2px; }
    .page.compact .job-title, .page.compact .main-title, .page.compact .sidebar-title-text {
      font-size: 11pt; margin-bottom: 6px;
    }

    .page.compact .section { margin-bottom: 12px; }
    .page.compact .sidebar-section { margin-bottom: 14px; }
    .page.compact .section-title {
      font-size: 10pt; margin-bottom: 7px; padding-bottom: 3px;
    }
    .page.compact .sidebar-section-title {
      font-size: 8pt; margin-bottom: 8px; padding-bottom: 4px;
    }
    .page.compact .sidebar-title {
      font-size: 9pt; margin-bottom: 7px; padding-bottom: 3px;
    }
    .page.compact .summary-text {
      font-size: 9pt; line-height: 1.45;
    }

    .page.compact .experience-item { margin-bottom: 10px; }
    .page.compact .exp-title { font-size: 9.5pt; }
    .page.compact .exp-company { font-size: 9pt; margin-bottom: 4px; }
    .page.compact .exp-header { margin-bottom: 4px; }
    .page.compact .role { font-size: 9.5pt; }
    .page.compact .experience-header { margin-bottom: 2px; }
    .page.compact .bullet-list li {
      font-size: 8.5pt; line-height: 1.4; margin-bottom: 1px; padding-left: 12px;
    }

    .page.compact .education-item, .page.compact .edu-item { margin-bottom: 7px; }
    .page.compact .edu-degree { font-size: 8.5pt; }
    .page.compact .edu-school { font-size: 8.5pt; }
    .page.compact .skills-text { font-size: 9pt; line-height: 1.5; }
    .page.compact .skill-name { font-size: 8pt; }
    .page.compact .skill-item { font-size: 8pt; margin-bottom: 6px; }
    .page.compact .contact-item { font-size: 8pt; margin-bottom: 5px; }
    .page.compact .contact-line { font-size: 8pt; }
    .page.compact .dates, .page.compact .exp-dates, .page.compact .edu-dates { font-size: 8pt; }
    .page.compact .photo-placeholder { width: 70px; height: 70px; margin-bottom: 12px; }

    /* ===== Dense tier ===== */
    .page.dense {
      padding: 0.3in 0.45in;
    }
    .page.dense .sidebar { padding: 0.3in 0.2in; }
    .page.dense .main { padding: 0.3in 0.35in 0.3in 0.25in; }

    .page.dense .header { margin-bottom: 10px; padding-bottom: 8px; }
    .page.dense .main-header { margin-bottom: 10px; }
    .page.dense .name, .page.dense .main-name { font-size: 21pt; margin-bottom: 2px; }
    .page.dense .sidebar-name { font-size: 14pt; margin-bottom: 2px; }
    .page.dense .job-title, .page.dense .main-title, .page.dense .sidebar-title-text {
      font-size: 10pt; margin-bottom: 4px;
    }

    .page.dense .section { margin-bottom: 8px; }
    .page.dense .sidebar-section { margin-bottom: 10px; }
    .page.dense .section-title {
      font-size: 9pt; margin-bottom: 5px; padding-bottom: 2px;
    }
    .page.dense .sidebar-section-title {
      font-size: 7.5pt; margin-bottom: 6px; padding-bottom: 3px;
    }
    .page.dense .sidebar-title {
      font-size: 8pt; margin-bottom: 5px; padding-bottom: 2px;
    }
    .page.dense .summary-text {
      font-size: 8.5pt; line-height: 1.35;
    }

    .page.dense .experience-item { margin-bottom: 7px; }
    .page.dense .exp-title { font-size: 9pt; }
    .page.dense .exp-company { font-size: 8.5pt; margin-bottom: 3px; }
    .page.dense .exp-header { margin-bottom: 2px; }
    .page.dense .role { font-size: 9pt; }
    .page.dense .experience-header { margin-bottom: 1px; }
    .page.dense .bullet-list li {
      font-size: 8pt; line-height: 1.3; margin-bottom: 0; padding-left: 10px;
    }

    .page.dense .education-item, .page.dense .edu-item { margin-bottom: 5px; }
    .page.dense .edu-degree { font-size: 8pt; }
    .page.dense .edu-school { font-size: 8pt; }
    .page.dense .skills-text { font-size: 8.5pt; line-height: 1.4; }
    .page.dense .skill-name { font-size: 7.5pt; }
    .page.dense .skill-item { font-size: 8pt; padding: 2px 0; margin-bottom: 4px; }
    .page.dense .skill-tag { font-size: 7pt; padding: 2px 8px; margin: 2px; }
    .page.dense .skill-chip { font-size: 7pt; padding: 2px 8px; margin: 2px; }
    .page.dense .contact-item { font-size: 7.5pt; margin-bottom: 4px; gap: 6px; }
    .page.dense .contact-line { font-size: 7.5pt; }
    .page.dense .dates, .page.dense .exp-dates, .page.dense .edu-dates { font-size: 7.5pt; }
    .page.dense .photo-placeholder { width: 60px; height: 60px; margin-bottom: 8px; }

    /* ===== One-page enforcement ===== */
    body {
      width: 8.5in;
      height: 11in;
      max-height: 11in;
      overflow: hidden;
    }
    .page {
      max-height: 11in;
      overflow: hidden;
    }
`;

// Script that measures content height and applies the lightest tier that fits.
const DENSITY_TIER_SCRIPT = `
<script>
(function() {
  var page = document.querySelector('.page');
  if (!page) return;
  var pageHeight = 11 * 96; // 11 inches at 96 dpi

  // Temporarily lift the cap so we can measure true content height
  page.style.maxHeight = 'none';
  page.style.overflow = 'visible';

  // Normal tier — already fits?
  if (page.scrollHeight <= pageHeight) {
    page.style.maxHeight = '11in';
    page.style.overflow = 'hidden';
    return;
  }

  // Try compact
  page.classList.add('compact');
  if (page.scrollHeight <= pageHeight) {
    page.style.maxHeight = '11in';
    page.style.overflow = 'hidden';
    return;
  }

  // Try dense
  page.classList.remove('compact');
  page.classList.add('dense');

  // Re-enforce cap regardless
  page.style.maxHeight = '11in';
  page.style.overflow = 'hidden';
})();
</script>`;

// Generate HTML for a specific template
export function generateTemplateHTML(
  templateId: string,
  data: ResumeData,
  options: TemplateOptions
): string {
  const template = TEMPLATE_REGISTRY[templateId];
  let html: string;
  if (!template) {
    html = TEMPLATE_REGISTRY.executive.generate(data, options);
  } else {
    html = template.generate(data, options);
  }

  // Inject density tier CSS before closing </style>
  html = html.replace('</style>', DENSITY_TIER_CSS + '\n  </style>');

  // Inject measurement script before closing </body>
  html = html.replace('</body>', DENSITY_TIER_SCRIPT + '\n</body>');

  return html;
}

// Default options
export const DEFAULT_TEMPLATE_OPTIONS: TemplateOptions = {
  showPhoto: false,
  showSkillBars: true,
  showIcons: true,
  accentColor: '#2563eb',
};
