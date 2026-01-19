import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// ============================================================
// CONFIGURATION CONSTANTS
// ============================================================

// Page specifications (US Letter)
const PAGE_CONFIG = {
  width: 612,   // 8.5 inches in points
  height: 792,  // 11 inches in points
  margin: 72,   // 1 inch margins
  contentWidth: 468,  // 612 - 72 - 72
  contentHeight: 648, // 792 - 72 - 72
};

// Using built-in Helvetica font family (no external loading required)
const FONT_FAMILY = "Helvetica";

// ============================================================
// TYPES
// ============================================================

export interface ResumeData {
  contact_info: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    address?: string;
  };
  summary: string;
  work_experience: {
    company: string;
    title: string;
    start_date: string;
    end_date: string;
    location?: string;
    description: string[];
  }[];
  skills: string[];
  education: {
    institution: string;
    degree: string;
    field: string;
    graduation_date: string;
    location?: string;
    description?: string;
  }[];
  awards?: string[];
}

export type TemplateStyle = "swiss" | "bold" | "creative";

export interface TemplateTheme {
  primaryColor: string;
  secondaryColor: string;
  accentLight: string;
  textDark: string;
  textLight: string;
  dividerColor: string;
}

// ============================================================
// THEME CONFIGURATION
// ============================================================

export const DEFAULT_THEMES: Record<TemplateStyle, TemplateTheme> = {
  swiss: {
    primaryColor: "#1a1a1a",
    secondaryColor: "#4a4a4a",
    accentLight: "#f5f5f5",
    textDark: "#1a1a1a",
    textLight: "#666666",
    dividerColor: "#cccccc",
  },
  bold: {
    primaryColor: "#1a1a1a",
    secondaryColor: "#333333",
    accentLight: "#f5f5f5",
    textDark: "#1a1a1a",
    textLight: "#666666",
    dividerColor: "#1a1a1a",
  },
  creative: {
    primaryColor: "#1a1a1a",
    secondaryColor: "#666666",
    accentLight: "#f5f5f5",
    textDark: "#1a1a1a",
    textLight: "#666666",
    dividerColor: "#e0e0e0",
  },
};

export const COLOR_PRESETS = [
  { name: "Black", value: "#1a1a1a" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Forest", value: "#1e4d3a" },
  { name: "Wine", value: "#5c1e3a" },
  { name: "Slate", value: "#3d4852" },
  { name: "Charcoal", value: "#36454f" },
];

// ============================================================
// TEMPLATE INFO
// ============================================================

export const TEMPLATE_INFO: Record<TemplateStyle, { name: string; description: string; defaultColor: string }> = {
  swiss: {
    name: "Swiss",
    description: "Clean, professional single-column layout. Great for corporate and technical roles.",
    defaultColor: "#1a1a1a",
  },
  bold: {
    name: "Bold",
    description: "Bold name header with modern styling. Perfect for sales and business roles.",
    defaultColor: "#1a1a1a",
  },
  creative: {
    name: "Creative",
    description: "Two-column creative layout. Ideal for design and creative director positions.",
    defaultColor: "#1a1a1a",
  },
};

// ============================================================
// TEMPLATE SELECTOR
// ============================================================

const ROLE_KEYWORDS: Record<TemplateStyle, string[]> = {
  swiss: [
    "engineer", "developer", "analyst", "accountant", "manager",
    "coordinator", "administrator", "specialist", "consultant",
    "scientist", "researcher", "architect", "technician"
  ],
  bold: [
    "sales", "marketing", "business development", "account executive",
    "recruiter", "hr", "communications", "public relations",
    "account manager", "customer success", "partnerships"
  ],
  creative: [
    "designer", "creative", "director", "artist", "ux", "ui",
    "brand", "video", "photographer", "illustrator", "writer",
    "content", "social media", "graphic"
  ],
};

export function suggestTemplate(jobTitle: string): TemplateStyle {
  const title = jobTitle.toLowerCase();

  for (const [template, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return template as TemplateStyle;
    }
  }

  return "swiss"; // Default to clean professional
}

export function getTemplateDescription(template: TemplateStyle): string {
  return TEMPLATE_INFO[template].description;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Parse bold text from <strong> tags
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseBoldText = (text: string, normalStyle: any, boldStyle: any) => {
  const parts = text.split(/(<strong>.*?<\/strong>)/g);
  return parts.map((part, index) => {
    if (part.startsWith("<strong>") && part.endsWith("</strong>")) {
      return <Text key={index} style={boldStyle}>{part.replace(/<\/?strong>/g, "")}</Text>;
    }
    return part ? <Text key={index} style={normalStyle}>{part}</Text> : null;
  }).filter(Boolean);
};

// Fit cover letter content to one page
function fitCoverLetterContent(content: string, maxChars: number = 2800): string {
  if (content.length <= maxChars) return content;
  return content.substring(0, maxChars).trim() + "...";
}

// ============================================================
// TEMPLATE 1: SWISS (Clean Single Column)
// ============================================================

const SwissResume: React.FC<{ data: ResumeData; color: string }> = ({ data, color }) => {
  const styles = StyleSheet.create({
    page: {
      padding: PAGE_CONFIG.margin,
      fontFamily: FONT_FAMILY,
      fontSize: 10,
      lineHeight: 1.5,
      color: "#1a1a1a",
    },
    name: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 4,
      color: color,
    },
    jobTitle: {
      fontSize: 16,
      color: "#4a4a4a",
      marginBottom: 16,
    },
    contactBlock: {
      marginBottom: 16,
    },
    contactLine: {
      fontSize: 10,
      marginBottom: 2,
      color: "#4a4a4a",
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: "#cccccc",
      marginVertical: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 12,
      marginTop: 8,
      color: color,
    },
    experienceItem: {
      marginBottom: 14,
    },
    experienceHeader: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 2,
    },
    companyName: {
      fontSize: 11,
      fontWeight: "bold",
    },
    jobTitleInline: {
      fontSize: 11,
      fontStyle: "italic",
    },
    dateRange: {
      fontSize: 9,
      color: "#666666",
      textTransform: "uppercase",
      marginBottom: 6,
    },
    bulletContainer: {
      marginBottom: 12,
    },
    bulletRow: {
      flexDirection: "row",
      marginBottom: 3,
    },
    bullet: {
      width: 15,
      fontSize: 10,
    },
    bulletText: {
      flex: 1,
      fontSize: 10,
    },
    boldText: {
      fontWeight: "bold",
    },
    paragraph: {
      fontSize: 10,
      lineHeight: 1.6,
      marginBottom: 12,
    },
    educationItem: {
      marginBottom: 10,
    },
    educationHeader: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 2,
    },
    schoolName: {
      fontSize: 11,
      fontWeight: "bold",
    },
    degreeInline: {
      fontSize: 11,
      fontStyle: "italic",
    },
    skillsText: {
      fontSize: 10,
      lineHeight: 1.6,
    },
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <Text style={styles.name}>{data.contact_info.name}</Text>
        {data.work_experience[0]?.title && (
          <Text style={styles.jobTitle}>{data.work_experience[0].title}</Text>
        )}

        {/* Contact Info */}
        <View style={styles.contactBlock}>
          {data.contact_info.address && (
            <Text style={styles.contactLine}>{data.contact_info.address}</Text>
          )}
          <Text style={styles.contactLine}>{data.contact_info.location}</Text>
          <Text style={styles.contactLine}>{data.contact_info.phone}</Text>
          <Text style={styles.contactLine}>{data.contact_info.email}</Text>
          {data.contact_info.linkedin && (
            <Text style={styles.contactLine}>{data.contact_info.linkedin}</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Summary */}
        {data.summary && (
          <>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.paragraph}>{data.summary}</Text>
          </>
        )}

        {/* Experience */}
        <Text style={styles.sectionTitle}>Experience</Text>
        {data.work_experience.map((job, idx) => (
          <View key={idx} style={styles.experienceItem}>
            <View style={styles.experienceHeader}>
              <Text style={styles.companyName}>{job.company}{job.location ? `, ${job.location}` : ""}</Text>
              <Text style={styles.jobTitleInline}> — {job.title}</Text>
            </View>
            <Text style={styles.dateRange}>{job.start_date} – {job.end_date}</Text>
            <View style={styles.bulletContainer}>
              {job.description.map((desc, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>
                    {parseBoldText(desc, {}, styles.boldText)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Skills */}
        <Text style={styles.sectionTitle}>Skills</Text>
        <Text style={styles.skillsText}>{data.skills.join(", ")}</Text>

        {/* Education */}
        <Text style={styles.sectionTitle}>Education</Text>
        {data.education.map((edu, idx) => (
          <View key={idx} style={styles.educationItem}>
            <View style={styles.educationHeader}>
              <Text style={styles.schoolName}>{edu.institution}{edu.location ? `, ${edu.location}` : ""}</Text>
              <Text style={styles.degreeInline}> — {edu.degree} in {edu.field}</Text>
            </View>
            <Text style={styles.dateRange}>{edu.graduation_date}</Text>
            {edu.description && <Text style={styles.paragraph}>{edu.description}</Text>}
          </View>
        ))}

        {/* Awards */}
        {data.awards && data.awards.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Awards</Text>
            {data.awards.map((award, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{award}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
};

// ============================================================
// TEMPLATE 2: BOLD (Large Name Header)
// ============================================================

const BoldResume: React.FC<{ data: ResumeData; color: string }> = ({ data, color }) => {
  const styles = StyleSheet.create({
    page: {
      padding: PAGE_CONFIG.margin,
      fontFamily: FONT_FAMILY,
      fontSize: 10,
      color: "#1a1a1a",
    },
    headerSection: {
      marginBottom: 20,
    },
    helloText: {
      fontSize: 18,
      fontWeight: "normal",
      marginBottom: 4,
      color: "#4a4a4a",
    },
    nameText: {
      fontSize: 36,
      fontWeight: "bold",
      marginBottom: 16,
      color: color,
    },
    contactBlock: {
      marginBottom: 16,
    },
    contactAddress: {
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 2,
      color: "#666666",
    },
    contactBold: {
      fontSize: 10,
      fontWeight: "bold",
      marginBottom: 2,
    },
    divider: {
      borderBottomWidth: 2,
      borderBottomColor: color,
      marginVertical: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 16,
      marginTop: 8,
      color: color,
    },
    dateSubheader: {
      fontSize: 10,
      color: "#666666",
      textTransform: "uppercase",
      marginBottom: 4,
      marginTop: 12,
    },
    experienceItem: {
      marginBottom: 14,
    },
    experienceHeader: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 6,
    },
    companyName: {
      fontSize: 11,
      fontWeight: "bold",
    },
    jobTitleInline: {
      fontSize: 11,
      fontStyle: "italic",
    },
    bulletRow: {
      flexDirection: "row",
      marginBottom: 4,
    },
    bullet: {
      width: 15,
      fontSize: 10,
    },
    bulletText: {
      flex: 1,
      fontSize: 10,
      lineHeight: 1.5,
    },
    boldText: {
      fontWeight: "bold",
    },
    paragraph: {
      fontSize: 10,
      lineHeight: 1.6,
      marginBottom: 12,
    },
    educationItem: {
      marginBottom: 10,
    },
    schoolName: {
      fontSize: 11,
      fontWeight: "bold",
    },
    degreeInline: {
      fontSize: 11,
      fontStyle: "italic",
    },
    skillsText: {
      fontSize: 10,
      lineHeight: 1.6,
    },
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.helloText}>Hello I'm</Text>
          <Text style={styles.nameText}>{data.contact_info.name}</Text>
        </View>

        {/* Contact Info */}
        <View style={styles.contactBlock}>
          {data.contact_info.address && (
            <Text style={styles.contactAddress}>{data.contact_info.address}</Text>
          )}
          <Text style={styles.contactAddress}>{data.contact_info.location}</Text>
          <Text style={styles.contactBold}>{data.contact_info.phone}</Text>
          <Text style={styles.contactBold}>{data.contact_info.email}</Text>
        </View>

        <View style={styles.divider} />

        {/* Summary */}
        {data.summary && (
          <>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.paragraph}>{data.summary}</Text>
          </>
        )}

        {/* Experience */}
        <Text style={styles.sectionTitle}>Experience</Text>
        {data.work_experience.map((job, idx) => (
          <View key={idx} style={styles.experienceItem}>
            <Text style={styles.dateSubheader}>{job.start_date} – {job.end_date}</Text>
            <View style={styles.experienceHeader}>
              <Text style={styles.companyName}>{job.company}{job.location ? `, ${job.location}` : ""}</Text>
              <Text style={styles.jobTitleInline}> — {job.title}</Text>
            </View>
            {job.description.map((desc, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  {parseBoldText(desc, {}, styles.boldText)}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Skills */}
        <Text style={styles.sectionTitle}>Skills</Text>
        <Text style={styles.skillsText}>{data.skills.join(", ")}</Text>

        {/* Education */}
        <Text style={styles.sectionTitle}>Education</Text>
        {data.work_experience.length > 0 && data.education.map((edu, idx) => (
          <View key={idx} style={styles.educationItem}>
            <Text style={styles.dateSubheader}>{edu.graduation_date}</Text>
            <View style={styles.experienceHeader}>
              <Text style={styles.schoolName}>{edu.institution}{edu.location ? `, ${edu.location}` : ""}</Text>
              <Text style={styles.degreeInline}> — {edu.degree} in {edu.field}</Text>
            </View>
            {edu.description && <Text style={styles.paragraph}>{edu.description}</Text>}
          </View>
        ))}

        {/* Awards */}
        {data.awards && data.awards.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Awards</Text>
            {data.awards.map((award, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{award}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
};

// ============================================================
// TEMPLATE 3: CREATIVE (Two-Column Table Layout)
// ============================================================

const CreativeResume: React.FC<{ data: ResumeData; color: string }> = ({ data, color }) => {
  const leftColumnWidth = "28%";
  const rightColumnWidth = "72%";

  const styles = StyleSheet.create({
    page: {
      padding: PAGE_CONFIG.margin,
      fontFamily: FONT_FAMILY,
      fontSize: 10,
      color: "#1a1a1a",
    },
    // Header row
    headerRow: {
      flexDirection: "row",
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    headerLeft: {
      width: leftColumnWidth,
      paddingRight: 20,
    },
    headerRight: {
      width: rightColumnWidth,
      paddingLeft: 20,
    },
    nameText: {
      fontSize: 24,
      fontWeight: "bold",
      color: color,
    },
    jobTitleText: {
      fontSize: 12,
      color: "#666666",
      marginTop: 4,
    },
    contactLine: {
      fontSize: 9,
      marginBottom: 2,
      color: "#4a4a4a",
    },
    // Section row
    sectionRow: {
      flexDirection: "row",
      marginBottom: 20,
    },
    sectionLabel: {
      width: leftColumnWidth,
      paddingRight: 20,
    },
    sectionLabelText: {
      fontSize: 11,
      fontWeight: "bold",
      color: color,
    },
    sectionLabelPrefix: {
      fontSize: 11,
      marginRight: 4,
      color: color,
    },
    sectionContent: {
      width: rightColumnWidth,
      paddingLeft: 20,
      borderLeftWidth: 1,
      borderLeftColor: "#e0e0e0",
    },
    // Experience items
    experienceItem: {
      marginBottom: 14,
    },
    companyJobTitle: {
      fontSize: 11,
      marginBottom: 2,
    },
    companyName: {
      fontWeight: "bold",
    },
    jobTitleInline: {
      fontWeight: "normal",
    },
    dateLine: {
      fontSize: 9,
      color: "#666666",
      textTransform: "uppercase",
      marginBottom: 4,
    },
    description: {
      fontSize: 10,
      lineHeight: 1.5,
    },
    bulletRow: {
      flexDirection: "row",
      marginBottom: 3,
    },
    bullet: {
      width: 15,
      fontSize: 10,
    },
    bulletText: {
      flex: 1,
      fontSize: 10,
      lineHeight: 1.5,
    },
    boldText: {
      fontWeight: "bold",
    },
    paragraph: {
      fontSize: 10,
      lineHeight: 1.6,
    },
    skillItem: {
      fontSize: 10,
      marginBottom: 2,
    },
    educationItem: {
      marginBottom: 10,
    },
    awardItem: {
      marginBottom: 4,
    },
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.nameText}>{data.contact_info.name}</Text>
            {data.work_experience[0]?.title && (
              <Text style={styles.jobTitleText}>{data.work_experience[0].title}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.contactLine}>{data.contact_info.email}</Text>
            <Text style={styles.contactLine}>{data.contact_info.phone}</Text>
            <Text style={styles.contactLine}>{data.contact_info.location}</Text>
            {data.contact_info.linkedin && (
              <Text style={styles.contactLine}>{data.contact_info.linkedin}</Text>
            )}
          </View>
        </View>

        {/* Summary Section */}
        {data.summary && (
          <View style={styles.sectionRow}>
            <View style={styles.sectionLabel}>
              <Text>
                <Text style={styles.sectionLabelPrefix}>ㅡ </Text>
                <Text style={styles.sectionLabelText}>Summary</Text>
              </Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.paragraph}>{data.summary}</Text>
            </View>
          </View>
        )}

        {/* Skills Section */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionLabel}>
            <Text>
              <Text style={styles.sectionLabelPrefix}>ㅡ </Text>
              <Text style={styles.sectionLabelText}>Skills</Text>
            </Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.paragraph}>{data.skills.join(", ")}</Text>
          </View>
        </View>

        {/* Experience Section */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionLabel}>
            <Text>
              <Text style={styles.sectionLabelPrefix}>ㅡ </Text>
              <Text style={styles.sectionLabelText}>Experience</Text>
            </Text>
          </View>
          <View style={styles.sectionContent}>
            {data.work_experience.map((job, idx) => (
              <View key={idx} style={styles.experienceItem}>
                <Text style={styles.companyJobTitle}>
                  <Text style={styles.companyName}>{job.company}</Text>
                  <Text style={styles.jobTitleInline}> / {job.title}</Text>
                </Text>
                <Text style={styles.dateLine}>
                  {job.start_date} – {job.end_date}{job.location ? `, ${job.location}` : ""}
                </Text>
                {job.description.map((desc, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>
                      {parseBoldText(desc, {}, styles.boldText)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Education Section */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionLabel}>
            <Text>
              <Text style={styles.sectionLabelPrefix}>ㅡ </Text>
              <Text style={styles.sectionLabelText}>Education</Text>
            </Text>
          </View>
          <View style={styles.sectionContent}>
            {data.education.map((edu, idx) => (
              <View key={idx} style={styles.educationItem}>
                <Text style={styles.companyJobTitle}>
                  <Text style={styles.companyName}>{edu.institution}</Text>
                  <Text style={styles.jobTitleInline}> / {edu.degree} in {edu.field}</Text>
                </Text>
                <Text style={styles.dateLine}>
                  {edu.graduation_date}{edu.location ? `, ${edu.location}` : ""}
                </Text>
                {edu.description && <Text style={styles.description}>{edu.description}</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Awards Section */}
        {data.awards && data.awards.length > 0 && (
          <View style={styles.sectionRow}>
            <View style={styles.sectionLabel}>
              <Text>
                <Text style={styles.sectionLabelPrefix}>ㅡ </Text>
                <Text style={styles.sectionLabelText}>Awards</Text>
              </Text>
            </View>
            <View style={styles.sectionContent}>
              {data.awards.map((award, idx) => (
                <View key={idx} style={styles.awardItem}>
                  <Text style={styles.description}>{award}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

// ============================================================
// COVER LETTER TEMPLATES
// ============================================================

interface CoverLetterProps {
  contactInfo: ResumeData["contact_info"];
  content: string;
  companyName: string;
  jobTitle: string;
  color: string;
}

// Swiss Cover Letter
const SwissCoverLetter: React.FC<CoverLetterProps> = ({ contactInfo, content, color }) => {
  const fittedContent = fitCoverLetterContent(content);
  const paragraphs = fittedContent.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
  const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const styles = StyleSheet.create({
    page: {
      padding: PAGE_CONFIG.margin,
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      lineHeight: 1.6,
      color: "#1a1a1a",
    },
    header: {
      marginBottom: 30,
    },
    name: {
      fontSize: 28,
      fontWeight: "bold",
      color: color,
      marginBottom: 4,
    },
    contactBlock: {
      marginBottom: 16,
    },
    contactLine: {
      fontSize: 10,
      marginBottom: 2,
      color: "#4a4a4a",
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: "#cccccc",
      marginVertical: 16,
    },
    date: {
      marginBottom: 24,
      fontSize: 11,
      color: "#4a4a4a",
    },
    paragraph: {
      fontSize: 11,
      color: "#1a1a1a",
      lineHeight: 1.6,
      marginBottom: 16,
      textAlign: "justify",
    },
    closing: {
      marginTop: 24,
    },
    closingText: {
      fontSize: 11,
      color: "#1a1a1a",
    },
    signature: {
      marginTop: 40,
      fontWeight: "bold",
      color: "#1a1a1a",
      fontSize: 11,
    },
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{contactInfo.name}</Text>
          <View style={styles.contactBlock}>
            <Text style={styles.contactLine}>{contactInfo.location}</Text>
            <Text style={styles.contactLine}>{contactInfo.phone}</Text>
            <Text style={styles.contactLine}>{contactInfo.email}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <Text style={styles.date}>{currentDate}</Text>
        {paragraphs.map((para, idx) => (
          <Text key={idx} style={styles.paragraph}>{para}</Text>
        ))}
        <View style={styles.closing}>
          <Text style={styles.closingText}>Sincerely,</Text>
          <Text style={styles.signature}>{contactInfo.name}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Bold Cover Letter
const BoldCoverLetter: React.FC<CoverLetterProps> = ({ contactInfo, content, color }) => {
  const fittedContent = fitCoverLetterContent(content);
  const paragraphs = fittedContent.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
  const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const styles = StyleSheet.create({
    page: {
      padding: PAGE_CONFIG.margin,
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      color: "#1a1a1a",
    },
    headerSection: {
      marginBottom: 20,
    },
    helloText: {
      fontSize: 18,
      fontWeight: "normal",
      marginBottom: 4,
      color: "#4a4a4a",
    },
    nameText: {
      fontSize: 36,
      fontWeight: "bold",
      marginBottom: 16,
      color: color,
    },
    contactBlock: {
      marginBottom: 16,
    },
    contactAddress: {
      fontSize: 9,
      textTransform: "uppercase",
      marginBottom: 2,
      color: "#666666",
    },
    contactBold: {
      fontSize: 10,
      fontWeight: "bold",
      marginBottom: 2,
    },
    divider: {
      borderBottomWidth: 2,
      borderBottomColor: color,
      marginVertical: 20,
    },
    date: {
      marginBottom: 24,
      fontSize: 11,
      color: "#4a4a4a",
    },
    paragraph: {
      fontSize: 11,
      color: "#1a1a1a",
      lineHeight: 1.6,
      marginBottom: 16,
      textAlign: "justify",
    },
    closing: {
      marginTop: 24,
    },
    closingText: {
      fontSize: 11,
      color: "#1a1a1a",
    },
    signature: {
      marginTop: 40,
      fontWeight: "bold",
      color: "#1a1a1a",
      fontSize: 11,
    },
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerSection}>
          <Text style={styles.helloText}>Hello I'm</Text>
          <Text style={styles.nameText}>{contactInfo.name}</Text>
        </View>
        <View style={styles.contactBlock}>
          <Text style={styles.contactAddress}>{contactInfo.location}</Text>
          <Text style={styles.contactBold}>{contactInfo.phone}</Text>
          <Text style={styles.contactBold}>{contactInfo.email}</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.date}>{currentDate}</Text>
        {paragraphs.map((para, idx) => (
          <Text key={idx} style={styles.paragraph}>{para}</Text>
        ))}
        <View style={styles.closing}>
          <Text style={styles.closingText}>Sincerely,</Text>
          <Text style={styles.signature}>{contactInfo.name}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Creative Cover Letter
const CreativeCoverLetter: React.FC<CoverLetterProps> = ({ contactInfo, content, color }) => {
  const fittedContent = fitCoverLetterContent(content);
  const paragraphs = fittedContent.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
  const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const leftColumnWidth = "28%";
  const rightColumnWidth = "72%";

  const styles = StyleSheet.create({
    page: {
      padding: PAGE_CONFIG.margin,
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      color: "#1a1a1a",
    },
    headerRow: {
      flexDirection: "row",
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    headerLeft: {
      width: leftColumnWidth,
      paddingRight: 20,
    },
    headerRight: {
      width: rightColumnWidth,
      paddingLeft: 20,
    },
    nameText: {
      fontSize: 24,
      fontWeight: "bold",
      color: color,
    },
    contactLine: {
      fontSize: 9,
      marginBottom: 2,
      color: "#4a4a4a",
    },
    contentRow: {
      flexDirection: "row",
    },
    contentLeft: {
      width: leftColumnWidth,
      paddingRight: 20,
    },
    contentRight: {
      width: rightColumnWidth,
      paddingLeft: 20,
      borderLeftWidth: 1,
      borderLeftColor: "#e0e0e0",
    },
    date: {
      fontSize: 9,
      color: "#666666",
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 11,
      color: "#1a1a1a",
      lineHeight: 1.6,
      marginBottom: 16,
      textAlign: "justify",
    },
    closing: {
      marginTop: 24,
    },
    closingText: {
      fontSize: 11,
      color: "#1a1a1a",
    },
    signature: {
      marginTop: 40,
      fontWeight: "bold",
      color: "#1a1a1a",
      fontSize: 11,
    },
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.nameText}>{contactInfo.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.contactLine}>{contactInfo.email}</Text>
            <Text style={styles.contactLine}>{contactInfo.phone}</Text>
            <Text style={styles.contactLine}>{contactInfo.location}</Text>
          </View>
        </View>

        {/* Content Row */}
        <View style={styles.contentRow}>
          <View style={styles.contentLeft}>
            <Text style={styles.date}>{currentDate}</Text>
          </View>
          <View style={styles.contentRight}>
            {paragraphs.map((para, idx) => (
              <Text key={idx} style={styles.paragraph}>{para}</Text>
            ))}
            <View style={styles.closing}>
              <Text style={styles.closingText}>Sincerely,</Text>
              <Text style={styles.signature}>{contactInfo.name}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

export async function generateResumePDF(
  data: ResumeData,
  template: TemplateStyle = "swiss",
  color?: string
): Promise<Blob> {
  const accentColor = color || TEMPLATE_INFO[template].defaultColor;

  let doc;
  switch (template) {
    case "bold":
      doc = <BoldResume data={data} color={accentColor} />;
      break;
    case "creative":
      doc = <CreativeResume data={data} color={accentColor} />;
      break;
    default:
      doc = <SwissResume data={data} color={accentColor} />;
  }

  return await pdf(doc).toBlob();
}

export async function generateCoverLetterPDF(
  contactInfo: ResumeData["contact_info"],
  content: string,
  companyName: string,
  jobTitle: string,
  template: TemplateStyle = "swiss",
  color?: string
): Promise<Blob> {
  const accentColor = color || TEMPLATE_INFO[template].defaultColor;
  const props = { contactInfo, content, companyName, jobTitle, color: accentColor };

  let doc;
  switch (template) {
    case "bold":
      doc = <BoldCoverLetter {...props} />;
      break;
    case "creative":
      doc = <CreativeCoverLetter {...props} />;
      break;
    default:
      doc = <SwissCoverLetter {...props} />;
  }

  return await pdf(doc).toBlob();
}
