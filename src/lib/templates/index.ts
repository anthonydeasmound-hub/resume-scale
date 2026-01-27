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

// Generate HTML for a specific template
export function generateTemplateHTML(
  templateId: string,
  data: ResumeData,
  options: TemplateOptions
): string {
  const template = TEMPLATE_REGISTRY[templateId];
  if (!template) {
    // Fallback to executive if template not found
    return TEMPLATE_REGISTRY.executive.generate(data, options);
  }
  return template.generate(data, options);
}

// Default options
export const DEFAULT_TEMPLATE_OPTIONS: TemplateOptions = {
  showPhoto: false,
  showSkillBars: true,
  showIcons: true,
  accentColor: '#2563eb',
};
