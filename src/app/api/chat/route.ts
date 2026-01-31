import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireUser();
    const {
      message,
      city_context,
      mayor_context,
      site_stats,
      investment_context,
      eleitorado_context,
    } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      return NextResponse.json({
        response:
          "⚠️ **A API Key da OpenAI não foi configurada.**\n\nConfigure a chave no arquivo `.env` para ativar a inteligência.",
        sources: [],
      });
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Mensagem invalida" },
        { status: 400 }
      );
    }

    const systemPrompt =
      "Voce e um consultor politico do sistema eParana. Responda sempre em portugues, de forma objetiva, resumida e amigavel. Seu foco e: politica, marketing politico, dados do IBGE, dados do TSE e insights a partir do banco de dados/informacoes do site. Use somente os dados fornecidos no contexto; nao invente numeros nem cite fontes externas quando houver dados no contexto. Quando houver dados no contexto, cite numeros e percentuais explicitamente. A resposta deve ser curta, mas quando a pergunta pedir detalhamento de dados (ex.: faixa etaria ou instrucao), liste todos os valores solicitados e reduza o restante. Sempre inclua um plano de acoes praticas com 3 a 5 itens. Pense sempre em captacao de novos votos, com orientacoes praticas e eticas. Se a pergunta sair desses temas, recuse educadamente e redirecione para os assuntos permitidos. Quando nao souber, diga de forma clara e indique quais dados faltam no sistema.";

    const contextParts: string[] = [];
    if (city_context) contextParts.push(`CIDADE: ${city_context}`);
    if (mayor_context) contextParts.push(`PREFEITO: ${mayor_context}`);
    if (site_stats) contextParts.push(`ESTATISTICAS DO SITE: ${site_stats}`);
    if (investment_context) contextParts.push(String(investment_context));
    if (eleitorado_context) contextParts.push(String(eleitorado_context));

    const contextBlock =
      contextParts.length > 0
        ? `Contexto adicional:\n${contextParts.join("\n")}`
        : "";

    const userPrompt = contextBlock
      ? `${contextBlock}\n\nPergunta do usuario: ${message}\n\nResponda usando apenas os dados acima e inclua o plano de acoes.`
      : `${message}\n\nResponda de forma curta e inclua o plano de acoes.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: errText || "Erro ao chamar OpenAI" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";

    return NextResponse.json({ response: content, sources: [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
