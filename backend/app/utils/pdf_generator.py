from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from datetime import datetime

def generate_share_certificate(
    shareholder_name: str,
    num_shares: int,
    issuance_date: datetime,
    certificate_id: int
) -> str:
    output_dir = "certificates"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    filename = f"{output_dir}/share_certificate_{certificate_id}.pdf"
    
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    
  
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width/2, height - 100, "SHARE CERTIFICATE")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 200, f"Certificate No: {certificate_id}")
    c.drawString(50, height - 220, f"This is to certify that")
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 260, shareholder_name)
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 300, f"is the registered holder of {num_shares} shares")
    c.drawString(50, height - 320, "of [Company Name]")
    
    c.drawString(50, height - 400, f"Date of Issue: {issuance_date.strftime('%B %d, %Y')}")
    
    c.line(50, 200, 250, 200)
    c.line(350, 200, 550, 200)
    c.drawString(100, 180, "Director")
    c.drawString(400, 180, "Secretary")
    
    c.save()
    
    return filename