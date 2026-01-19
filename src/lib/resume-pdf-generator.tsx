import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

// Register fonts for professional typography
Font.register({
  family: "Times-Roman",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times%20New%20Roman.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times%20New%20Roman%20Bold.ttf", fontWeight: "bold" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times%20New%20Roman%20Italic.ttf", fontStyle: "italic" },
  ],
});

export interface ResumeData {
  contact_info: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  summary: string;
  work_experience: {
    company: string;
    title: string;
    start_date: string;
    end_date: string;
    description: string[];
  }[];
  skills: string[];
  education: {
    institution: string;
    degree: string;
    field: string;
    graduation_date: string;
  }[];
}

interface ResumeProps {
  data: ResumeData;
  accentColor: string;
  style: "classic" | "modern" | "minimal";
}

// Create styles
const createStyles = (accentColor: string, style: string) =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Times-Roman",
      fontSize: 10,
      lineHeight: 1.4,
      color: "#333333",
    },
    header: {
      textAlign: "center",
      marginBottom: 15,
      paddingBottom: 12,
      borderBottomWidth: style === "minimal" ? 0 : 2,
      borderBottomColor: accentColor,
      borderBottomStyle: "solid",
    },
    name: {
      fontSize: 22,
      fontWeight: "bold",
      color: accentColor,
      marginBottom: 4,
      letterSpacing: 1,
    },
    contactRow: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    contactText: {
      fontSize: 9,
      color: "#666666",
    },
    contactSeparator: {
      fontSize: 9,
      color: "#999999",
      marginHorizontal: 4,
    },
    section: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: accentColor,
      marginBottom: 6,
      paddingBottom: 2,
      borderBottomWidth: 1,
      borderBottomColor: "#dddddd",
      borderBottomStyle: "solid",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    summaryText: {
      fontSize: 10,
      lineHeight: 1.5,
      textAlign: "justify",
    },
    jobContainer: {
      marginBottom: 10,
    },
    jobHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 2,
    },
    jobTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#222222",
    },
    jobDate: {
      fontSize: 9,
      color: "#666666",
    },
    jobCompany: {
      fontSize: 10,
      color: "#555555",
      marginBottom: 4,
    },
    bulletList: {
      marginLeft: 10,
    },
    bulletItem: {
      flexDirection: "row",
      marginBottom: 2,
    },
    bullet: {
      width: 12,
      fontSize: 10,
    },
    bulletText: {
      flex: 1,
      fontSize: 10,
      lineHeight: 1.4,
    },
    boldText: {
      fontWeight: "bold",
    },
    skillsText: {
      fontSize: 10,
      lineHeight: 1.6,
    },
    educationItem: {
      marginBottom: 6,
    },
    educationHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    educationDegree: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#222222",
    },
    educationDate: {
      fontSize: 9,
      color: "#666666",
    },
    educationSchool: {
      fontSize: 10,
      color: "#555555",
    },
  });

// Helper to parse bold text
const parseBoldText = (text: string, styles: ReturnType<typeof createStyles>) => {
  const parts = text.split(/(<strong>.*?<\/strong>)/g);
  return parts.map((part, index) => {
    if (part.startsWith("<strong>") && part.endsWith("</strong>")) {
      const boldContent = part.replace(/<\/?strong>/g, "");
      return (
        <Text key={index} style={styles.boldText}>
          {boldContent}
        </Text>
      );
    }
    return <Text key={index}>{part}</Text>;
  });
};

// Resume Document Component
const ResumeDocument: React.FC<ResumeProps> = ({ data, accentColor, style }) => {
  const styles = createStyles(accentColor, style);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.contact_info.name}</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactText}>{data.contact_info.email}</Text>
            <Text style={styles.contactSeparator}>|</Text>
            <Text style={styles.contactText}>{data.contact_info.phone}</Text>
            <Text style={styles.contactSeparator}>|</Text>
            <Text style={styles.contactText}>{data.contact_info.location}</Text>
            {data.contact_info.linkedin && (
              <>
                <Text style={styles.contactSeparator}>|</Text>
                <Text style={styles.contactText}>{data.contact_info.linkedin}</Text>
              </>
            )}
          </View>
        </View>

        {/* Professional Summary */}
        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{data.summary}</Text>
          </View>
        )}

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Experience</Text>
          {data.work_experience.map((job, idx) => (
            <View key={idx} style={styles.jobContainer}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobDate}>
                  {job.start_date} - {job.end_date}
                </Text>
              </View>
              <Text style={styles.jobCompany}>{job.company}</Text>
              <View style={styles.bulletList}>
                {job.description.slice(0, 4).map((desc, i) => (
                  <View key={i} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>
                      {parseBoldText(desc, styles)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.skillsText}>{data.skills.join("  •  ")}</Text>
        </View>

        {/* Education */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {data.education.map((edu, idx) => (
            <View key={idx} style={styles.educationItem}>
              <View style={styles.educationHeader}>
                <Text style={styles.educationDegree}>
                  {edu.degree} in {edu.field}
                </Text>
                <Text style={styles.educationDate}>{edu.graduation_date}</Text>
              </View>
              <Text style={styles.educationSchool}>{edu.institution}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// Cover Letter Document Component
interface CoverLetterProps {
  contactInfo: ResumeData["contact_info"];
  content: string;
  companyName: string;
  jobTitle: string;
  accentColor: string;
}

const CoverLetterDocument: React.FC<CoverLetterProps> = ({
  contactInfo,
  content,
  companyName,
  jobTitle,
  accentColor,
}) => {
  const styles = StyleSheet.create({
    page: {
      padding: 50,
      fontFamily: "Times-Roman",
      fontSize: 11,
      lineHeight: 1.6,
      color: "#333333",
    },
    header: {
      marginBottom: 30,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: accentColor,
      borderBottomStyle: "solid",
    },
    name: {
      fontSize: 20,
      fontWeight: "bold",
      color: accentColor,
      marginBottom: 4,
    },
    contactInfo: {
      fontSize: 10,
      color: "#666666",
    },
    date: {
      marginBottom: 20,
      fontSize: 11,
      color: "#555555",
    },
    greeting: {
      marginBottom: 15,
      fontSize: 11,
    },
    paragraph: {
      marginBottom: 12,
      textAlign: "justify",
      fontSize: 11,
      lineHeight: 1.7,
    },
    closing: {
      marginTop: 20,
    },
    signature: {
      marginTop: 30,
      fontWeight: "bold",
    },
  });

  // Parse content into paragraphs
  const paragraphs = content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Get current date
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{contactInfo.name}</Text>
          <Text style={styles.contactInfo}>
            {contactInfo.email} | {contactInfo.phone} | {contactInfo.location}
          </Text>
        </View>

        {/* Date */}
        <Text style={styles.date}>{currentDate}</Text>

        {/* Body */}
        {paragraphs.map((para, idx) => (
          <Text key={idx} style={styles.paragraph}>
            {para}
          </Text>
        ))}

        {/* Signature */}
        <View style={styles.closing}>
          <Text>Sincerely,</Text>
          <Text style={styles.signature}>{contactInfo.name}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Export functions to generate PDF blobs
export async function generateResumePDF(
  data: ResumeData,
  accentColor: string = "#1e40af",
  style: "classic" | "modern" | "minimal" = "classic"
): Promise<Blob> {
  const doc = <ResumeDocument data={data} accentColor={accentColor} style={style} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export async function generateCoverLetterPDF(
  contactInfo: ResumeData["contact_info"],
  content: string,
  companyName: string,
  jobTitle: string,
  accentColor: string = "#1e40af"
): Promise<Blob> {
  const doc = (
    <CoverLetterDocument
      contactInfo={contactInfo}
      content={content}
      companyName={companyName}
      jobTitle={jobTitle}
      accentColor={accentColor}
    />
  );
  const blob = await pdf(doc).toBlob();
  return blob;
}
