#!/usr/bin/env python3
"""
Generate a sample engagement letter PDF for testing
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from datetime import datetime
import os

# Output path
output_path = os.path.join(os.path.dirname(__file__), "Sample-Engagement-Letter.pdf")

# Create PDF
doc = SimpleDocTemplate(output_path, pagesize=letter,
                        topMargin=0.75*inch, bottomMargin=0.75*inch,
                        leftMargin=0.75*inch, rightMargin=0.75*inch)

# Container for the 'Flowable' objects
elements = []

# Define styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=16,
    textColor=colors.HexColor('#2C3E50'),
    spaceAfter=30,
    alignment=1  # Center
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=12,
    textColor=colors.HexColor('#34495E'),
    spaceAfter=12,
    spaceBefore=12
)

body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['BodyText'],
    fontSize=10,
    leading=14,
    spaceAfter=8
)

# Header
header_data = [
    ['BDO Al Nisf & Partners', ''],
    ['Certified Public Accountants', ''],
    ['P.O. Box 24984, Safat 13110, Kuwait', ''],
    ['Tel: +965 2299 6200 | Fax: +965 2299 6222', '']
]

header_table = Table(header_data, colWidths=[4*inch, 2.5*inch])
header_table.setStyle(TableStyle([
    ('ALIGN', (0, 0), (0, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (0, -1), 9),
    ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#2C3E50')),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
]))
elements.append(header_table)
elements.append(Spacer(1, 0.3*inch))

# Date
date_text = f"Date: {datetime.now().strftime('%B %d, %Y')}"
elements.append(Paragraph(date_text, body_style))
elements.append(Spacer(1, 0.2*inch))

# Client Address
elements.append(Paragraph("Client 014 Company", heading_style))
elements.append(Paragraph("123 Business District", body_style))
elements.append(Paragraph("Kuwait City, State of Kuwait", body_style))
elements.append(Spacer(1, 0.2*inch))

# Subject
elements.append(Paragraph("Subject: Engagement Letter for Statutory Audit Services", heading_style))
elements.append(Spacer(1, 0.15*inch))

# Salutation
elements.append(Paragraph("Dear Board of Directors,", body_style))
elements.append(Spacer(1, 0.15*inch))

# Body Content
content = [
    ("1. Introduction", "We are pleased to confirm our acceptance and understanding of this engagement to audit the financial statements of Client 014 Company for the year ending December 31, 2026."),
    
    ("2. Objective and Scope", "The objective of our audit is to express an opinion on the financial statements. We will conduct our audit in accordance with International Standards on Auditing (ISAs). Those standards require that we comply with ethical requirements and plan and perform the audit to obtain reasonable assurance about whether the financial statements are free from material misstatement."),
    
    ("3. Management Responsibilities", "Management is responsible for the preparation and fair presentation of the financial statements in accordance with International Financial Reporting Standards (IFRS), and for such internal control as management determines is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error."),
    
    ("4. Auditor Responsibilities", "Our responsibility is to express an opinion on these financial statements based on our audit. We will conduct our audit in accordance with ISAs, which require that we obtain reasonable assurance about whether the financial statements are free from material misstatement. An audit involves performing procedures to obtain audit evidence about the amounts and disclosures in the financial statements."),
    
    ("5. Expected Deliverables", """Our deliverables will include:
    • Audited financial statements with our independent auditor's report
    • Management letter highlighting control deficiencies (if any)
    • Summary of audit adjustments
    • Meeting with management and those charged with governance"""),
    
    ("6. Professional Fees", "Our professional fees for this engagement are estimated at KWD 15,000, payable in installments as follows: 40% upon commencement, 30% upon fieldwork completion, and 30% upon report delivery. Additional services requested beyond the scope of this engagement will be billed separately at our standard hourly rates."),
    
    ("7. Engagement Period", "This engagement letter covers the audit for the financial year ending December 31, 2026. The fieldwork is expected to commence in February 2027 with the final report expected by March 31, 2027."),
]

for heading, text in content:
    elements.append(Paragraph(heading, heading_style))
    elements.append(Paragraph(text, body_style))
    elements.append(Spacer(1, 0.1*inch))

# Closing
elements.append(Spacer(1, 0.2*inch))
elements.append(Paragraph("We appreciate the opportunity to serve as your auditors and look forward to a successful engagement.", body_style))
elements.append(Spacer(1, 0.3*inch))

# Signature Section
elements.append(Paragraph("Yours sincerely,", body_style))
elements.append(Spacer(1, 0.4*inch))

signature_data = [
    ['_______________________', '_______________________'],
    ['James Jackson', 'Robert Taylor'],
    ['Engagement Partner', 'Quality Control Partner'],
    ['BDO Al Nisf & Partners', 'BDO Al Nisf & Partners']
]

signature_table = Table(signature_data, colWidths=[3*inch, 3*inch])
signature_table.setStyle(TableStyle([
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('TOPPADDING', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, -1), (-1, -1), 3),
]))
elements.append(signature_table)

# Acceptance Section
elements.append(Spacer(1, 0.4*inch))
elements.append(Paragraph("<b>CLIENT ACCEPTANCE</b>", heading_style))
elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph("We acknowledge receipt of this letter and confirm our understanding and acceptance of the terms of the engagement as outlined above.", body_style))
elements.append(Spacer(1, 0.3*inch))

acceptance_data = [
    ['Signature: _______________________', 'Date: _______________________'],
    ['Name: _______________________', ''],
    ['Title: _______________________', '']
]

acceptance_table = Table(acceptance_data, colWidths=[3*inch, 3*inch])
acceptance_table.setStyle(TableStyle([
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
elements.append(acceptance_table)

# Build PDF
doc.build(elements)

print(f"✅ Engagement letter generated successfully!")
print(f"📄 Location: {output_path}")
print(f"📏 File size: {os.path.getsize(output_path):,} bytes")
