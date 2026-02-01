import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

// Import template registry and generator
import { TEMPLATE_REGISTRY, generateTemplateHTML, TemplateOptions } from '../src/lib/templates/index';
import { ResumeData } from '../src/types/resume';

// Sample resume data for preview generation
const SAMPLE_RESUME_DATA: ResumeData = {
  contactInfo: {
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexjohnson',
  },
  jobTitle: 'Senior Software Engineer',
  summary: 'Results-driven software engineer with 8+ years of experience building scalable web applications. Passionate about clean code, user experience, and mentoring junior developers.',
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      dates: '2020 - Present',
      description: [
        'Led development of microservices architecture serving 2M+ daily active users',
        'Reduced API response times by 40% through optimization and caching strategies',
        'Mentored team of 5 junior developers and conducted code reviews',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'StartupXYZ',
      dates: '2017 - 2020',
      description: [
        'Built React-based dashboard used by 500+ enterprise customers',
        'Implemented CI/CD pipelines reducing deployment time by 60%',
        'Collaborated with product team to define technical requirements',
      ],
    },
  ],
  education: [
    {
      school: 'University of California, Berkeley',
      degree: 'B.S. Computer Science',
      dates: '2013 - 2017',
      specialty: 'Software Engineering',
    },
    {
      school: 'Stanford Online',
      degree: 'Certificate',
      dates: '2019',
      specialty: 'Machine Learning',
    },
  ],
  skills: [
    'JavaScript', 'TypeScript', 'React', 'Node.js',
    'Python', 'PostgreSQL', 'AWS', 'Docker',
  ],
  languages: ['English (Native)', 'Spanish (Conversational)'],
  certifications: [
    { name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2021' },
  ],
  honors: [
    { title: 'Employee of the Year', issuer: 'TechCorp Inc.', date: '2022' },
  ],
};

const DEFAULT_OPTIONS: TemplateOptions = {
  showPhoto: false,
  showSkillBars: true,
  showIcons: true,
  showLanguages: false,
  accentColor: '#2563eb',
};

async function generatePreviews() {
  const outputDir = path.join(__dirname, '../public/template-previews');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const templateIds = Object.keys(TEMPLATE_REGISTRY);
  console.log(`Generating previews for ${templateIds.length} templates...`);

  for (const templateId of templateIds) {
    try {
      console.log(`  Generating: ${templateId}...`);

      const html = generateTemplateHTML(templateId, SAMPLE_RESUME_DATA, DEFAULT_OPTIONS);

      const page = await browser.newPage();

      // Set viewport to match letter page dimensions at 96 DPI
      // 8.5in * 96 = 816px, 11in * 96 = 1056px
      await page.setViewport({
        width: 816,
        height: 1056,
        deviceScaleFactor: 1,
      });

      // Inject white background to prevent transparent/black screenshots
      const htmlWithBackground = html.replace(
        '<body>',
        '<body style="background-color: white;">'
      );

      await page.setContent(htmlWithBackground, { waitUntil: 'networkidle0' });

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');

      // Screenshot the page with white background
      const screenshotPath = path.join(outputDir, `${templateId}.png`);
      await page.screenshot({
        path: screenshotPath,
        type: 'png',
        omitBackground: false,
        clip: {
          x: 0,
          y: 0,
          width: 816,
          height: 1056,
        },
      });

      await page.close();
      console.log(`    Saved: ${screenshotPath}`);
    } catch (error) {
      console.error(`  Error generating ${templateId}:`, error);
    }
  }

  await browser.close();
  console.log('\nDone! Generated previews for all templates.');
}

generatePreviews().catch(console.error);
