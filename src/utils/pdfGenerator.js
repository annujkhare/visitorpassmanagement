import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export async function generateVisitorBadgePdf(pass = {}, organization = null) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [85, 125],
  });

  const safeText = (value, fallback = "") => {
    if (value === null || value === undefined) {
      return fallback;
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (typeof value === "object") {
      if (value.name !== undefined) {
        return String(value.name);
      }

      if (value.label !== undefined) {
        return String(value.label);
      }

      if (value.value !== undefined) {
        return String(value.value);
      }

      try {
        return JSON.stringify(value);
      } catch {
        return fallback;
      }
    }

    return fallback;
  };

  const orgName = safeText(organization?.name, "Apex Global Tech HQ");

  const passType = safeText(pass?.passType, "visitor");

  const visitorName = safeText(pass?.visitorName, "Visitor");

  const visitorCompany = safeText(pass?.visitorCompany, "Visitor");

  const passNumber = safeText(pass?.passNumber, "N/A");

  const hostName = safeText(pass?.hostName, "N/A");

  const hostDepartment = safeText(pass?.hostDepartment, "N/A");

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 85, 125, "F");

  let headerColor = [30, 41, 59];

  if (passType.toLowerCase() === "vip") {
    headerColor = [99, 102, 241];
  } else if (passType.toLowerCase() === "interview") {
    headerColor = [16, 185, 129];
  } else if (passType.toLowerCase() === "contractor") {
    headerColor = [245, 158, 11];
  }

  doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);

  doc.rect(0, 0, 85, 24, "F");

  doc.setTextColor(255, 255, 255);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  const badgeTitle = `${passType.toUpperCase().replace(/_/g, " ")} BADGE`;

  doc.text(badgeTitle, 42.5, 8, {
    align: "center",
  });

  doc.setFontSize(10);

  doc.text(orgName, 42.5, 16, {
    align: "center",
  });

  doc.setFillColor(226, 232, 240);

  doc.roundedRect(26.5, 28, 32, 32, 2, 2, "F");

  doc.setTextColor(100, 116, 139);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  doc.text("PHOTO ID", 42.5, 45, {
    align: "center",
  });

  doc.setTextColor(15, 23, 42);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");

  doc.text(visitorName, 42.5, 66, {
    align: "center",
  });

  doc.setTextColor(100, 116, 139);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  doc.text(visitorCompany, 42.5, 71, {
    align: "center",
  });

  doc.setFillColor(241, 245, 249);

  doc.roundedRect(20, 74, 45, 6, 3, 3, "F");

  doc.setTextColor(51, 65, 85);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  doc.text(passNumber, 42.5, 78.5, {
    align: "center",
  });

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);

  const hostText = `Host: ${hostName} (${hostDepartment})`;

  doc.text(hostText, 42.5, 85, {
    align: "center",
  });

  let validUntilStr = "N/A";

  if (pass?.validUntil) {
    const validUntilDate = new Date(pass.validUntil);

    if (!Number.isNaN(validUntilDate.getTime())) {
      validUntilStr = validUntilDate.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  doc.setFont("helvetica", "bold");

  doc.setTextColor(185, 28, 28);

  doc.text(`Expires: ${validUntilStr}`, 42.5, 89.5, {
    align: "center",
  });
  try {
    const qrValue =
      pass?.qrCodeData ||
      pass?.qrCode ||
      pass?.qrData ||
      pass?.qrToken ||
      pass?.passNumber ||
      pass?.id;

    if (!qrValue) {
      throw new Error("No QR data available for this pass");
    }

    console.log("[PDF] Generating QR for:", qrValue);

    const qrImage = await QRCode.toDataURL(String(qrValue), {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 300,
    });

    doc.addImage(qrImage, "PNG", 31, 92, 23, 23);

    console.log("[PDF] QR code added successfully");
  } catch (error) {
    console.error("[PDF] QR generation failed:", error);

    doc.setDrawColor(203, 213, 225);

    doc.rect(31, 92, 23, 23);

    doc.setTextColor(100, 116, 139);

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");

    doc.text("QR UNAVAILABLE", 42.5, 104, {
      align: "center",
    });
  }
  doc.setTextColor(148, 163, 184);

  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");

  doc.text(
    "Show this badge at the gate to check in or out.",
    42.5,
    120,
    {
      align: "center",
    },
  );

  const fileName = `${passNumber || "visitor"}_visitor_badge.pdf`;

  doc.save(fileName);

  console.log(`[PDF] Badge generated successfully: ${fileName}`);
}
