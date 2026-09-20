import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.post("/api/pages", async (req, res) => {
  try {
    const { nomeCasal, dataInicio, mensagem, fotoUrl, spotifyTrackId } = req.body;
    const slugBase = nomeCasal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const slug = slugBase + "-" + Math.floor(1000 + Math.random() * 9000);
    const novaPagina = await prisma.page.create({ data: { slug, nomeCasal, dataInicio, mensagem, fotoUrl, spotifyTrackId } });
    const urlPublica = "http://localhost:3000/p/" + novaPagina.slug;
    const qrCodeDataUrl = await QRCode.toDataURL(urlPublica, { width: 400, margin: 2, color: { dark: "#e11d48", light: "#ffffff" } });
    res.status(201).json({ success: true, slug: novaPagina.slug, url: urlPublica, qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao guardar a pagina." });
  }
});

app.get("/api/pages/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const pagina = await prisma.page.findUnique({ where: { slug } });
    if (!pagina) return res.status(404).json({ error: "Pagina nao encontrada." });
    res.json(pagina);
  } catch (error) {
    res.status(500).json({ error: "Erro ao procurar a pagina." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Backend rodando em http://localhost:" + PORT));