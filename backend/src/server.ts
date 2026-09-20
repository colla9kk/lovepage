import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import { MercadoPagoConfig, Payment } from "mercadopago";

const app = express();
const prisma = new PrismaClient();

// Access Token do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-1410507370283496-091923-3827f4881021bd9a3f081cbce5d72380-3699720815",
});

const payment = new Payment(client);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rota 1: Criar cobrança PIX Real no Mercado Pago
app.post("/api/checkout/pix", async (req, res) => {
  try {
    const { nomeCasal } = req.body;

    const paymentData = await payment.create({
      body: {
        transaction_amount: 19.90,
        description: `LovePage - Presente (${nomeCasal || "Casal"})`,
        payment_method_id: "pix",
        payer: {
          email: "comprador@lovepage.com.br",
          first_name: nomeCasal ? nomeCasal.split(" ")[0] : "Cliente",
          last_name: "LovePage",
          identification: {
            type: "CPF",
            number: "11144477735", // CPF com algoritmo Válido para aprovação da API do Mercado Pago
          },
        },
      },
    });

    const qrCodeBase64 = paymentData.point_of_interaction?.transaction_data?.qr_code_base64;
    const qrCodeCopiaCola = paymentData.point_of_interaction?.transaction_data?.qr_code;
    const paymentId = paymentData.id;

    res.json({
      success: true,
      paymentId,
      qrCodeBase64: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
      qrCodeCopiaCola,
    });
  } catch (error: any) {
    console.error("Erro detalhado do Mercado Pago:", error);
    const mensagemErro =
      error?.cause?.[0]?.description || error?.message || "Falha ao comunicar com o Mercado Pago.";
    res.status(500).json({ error: mensagemErro });
  }
});

// Rota 2: Verificar status do pagamento PIX
app.get("/api/checkout/status/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const paymentInfo = await payment.get({ id: paymentId });

    res.json({
      status: paymentInfo.status,
      isApproved: paymentInfo.status === "approved",
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao verificar status do pagamento." });
  }
});

// Rota 3: Salvar a página do casal no banco
app.post("/api/pages", async (req, res) => {
  try {
    const { nomeCasal, dataInicio, mensagem, fotoUrl, spotifyTrackId } = req.body;
    const slugBase = nomeCasal
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const slug = slugBase + "-" + Math.floor(1000 + Math.random() * 9000);

    const novaPagina = await prisma.page.create({
      data: { slug, nomeCasal, dataInicio, mensagem, fotoUrl, spotifyTrackId },
    });

    const urlPublica = "http://localhost:3000/p/" + novaPagina.slug;
    const qrCodeDataUrl = await QRCode.toDataURL(urlPublica, {
      width: 400,
      margin: 2,
      color: { dark: "#e11d48", light: "#ffffff" },
    });

    res.status(201).json({ success: true, slug: novaPagina.slug, url: urlPublica, qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao guardar a pagina." });
  }
});

// Rota 4: Buscar dados da página pública
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