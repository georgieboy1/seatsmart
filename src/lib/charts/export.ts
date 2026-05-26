import { toPng } from "html-to-image";

export function downloadFile(content: string, fileName: string, contentType: string) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportToCsv(
  name: string,
  assignments: Record<string, string>,
  studentsById: Map<string, { name: string }>
) {
  const rows = [["Seat Position", "Student Name"]];
  
  Object.entries(assignments).forEach(([key, externalId]) => {
    const student = studentsById.get(externalId);
    if (student) {
      rows.push([key, student.name]);
    }
  });

  const content = rows.map((e) => e.join(",")).join("\n");
  downloadFile(content, `${name.replace(/\s+/g, "_")}.csv`, "text/csv");
}

export function exportToJson(name: string, data: unknown) {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, `${name.replace(/\s+/g, "_")}.json`, "application/json");
}

export async function exportToPng(name: string, elementId: string) {
  const node = document.getElementById(elementId);
  if (!node) return;

  try {
    const dataUrl = await toPng(node, {
      backgroundColor: "#ffffff",
      style: {
        transform: "scale(1)",
      },
    });
    const link = document.createElement("a");
    link.download = `${name.replace(/\s+/g, "_")}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("PNG export failed:", error);
    alert("Failed to export PNG. Try printing the page instead.");
  }
}
