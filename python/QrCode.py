import qrcode

# Testo o link da convertire
data = "https://blackinfinityro.github.io/Comple-Matteo/"

# Genera il QR code
img = qrcode.make(data)

# Salva il file PNG
img.save("qrcode.png")

print("✅ QR code creato: test.png")
