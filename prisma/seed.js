const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function loadJson(fileName) {
  const filePath = path.join(__dirname, "..", "data", fileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

async function main() {
  const sources = [
    {
      name: "IBGE",
      description: "Dados municipais do Paraná (IBGE)",
    },
    {
      name: "TSE",
      description: "Perfil do eleitorado do Paraná (TSE)",
    },
  ];

  for (const source of sources) {
    await prisma.datasetSource.upsert({
      where: { name: source.name },
      update: { description: source.description },
      create: source,
    });
  }

  const ibgePayload = await loadJson("cidades_pr.json");
  const tsePayload = await loadJson("dados_eleitorais.json");

  if (ibgePayload) {
    const source = await prisma.datasetSource.findUnique({
      where: { name: "IBGE" },
    });
    const existing = await prisma.datasetRecord.findFirst({
      where: { sourceId: source.id },
      orderBy: { createdAt: "desc" },
    });
    if (!existing) {
      await prisma.datasetRecord.create({
        data: {
          sourceId: source.id,
          referenceDate: new Date(),
          payloadJson: ibgePayload,
        },
      });
    }
  }

  if (tsePayload) {
    const source = await prisma.datasetSource.findUnique({
      where: { name: "TSE" },
    });
    const existing = await prisma.datasetRecord.findFirst({
      where: { sourceId: source.id },
      orderBy: { createdAt: "desc" },
    });
    if (!existing) {
      await prisma.datasetRecord.create({
        data: {
          sourceId: source.id,
          referenceDate: new Date(),
          payloadJson: tsePayload,
        },
      });
    }
  }

  const investmentsData = await loadJson("investments_data.json");
  const votesData = await loadJson("votos_data.json");
  const campaignData = await loadJson("campaign_data.json");

  if (Array.isArray(investmentsData)) {
    await prisma.investment.deleteMany();
    await prisma.investment.createMany({
      data: investmentsData.map((item) => ({
        cityId: item.cityId,
        cityName: item.cityName,
        year: item.ano,
        value: item.valor,
        area: item.area || null,
        type: item.tipo || null,
        description: item.descricao || null,
      })),
    });
  }

  if (votesData && typeof votesData === "object") {
    await prisma.vote.deleteMany();
    const voteRows = [];
    Object.entries(votesData).forEach(([cityId, entries]) => {
      entries.forEach((entry) => {
        voteRows.push({
          cityId,
          year: entry.ano,
          votes: entry.votos,
        });
      });
    });
    if (voteRows.length) {
      await prisma.vote.createMany({ data: voteRows });
    }
  }

  if (campaignData && typeof campaignData === "object") {
    await prisma.campaignAggregate.deleteMany();
    const rows = Object.entries(campaignData).map(([cityId, data]) => ({
      cityId,
      votes: data.votes || 0,
      money: data.money || 0,
    }));
    if (rows.length) {
      await prisma.campaignAggregate.createMany({ data: rows });
    }
  }

}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
