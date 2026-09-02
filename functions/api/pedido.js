export async function onRequestPost(context) {
  try {
    // Recebe os dados enviados pelo index.html
    const dados = await context.request.json();

    // Validação básica
    if (!dados || !dados.descricao || !dados.descricao.trim()) {
      return respostaJSON({
        success: false,
        message: 'A descrição é obrigatória.'
      }, 400);
    }

    // A chave fica armazenada somente na Cloudflare
    const apiKey = context.env.API_KEY;
    const appsScriptUrl = context.env.APPS_SCRIPT_URL;

    if (!apiKey || !appsScriptUrl) {
      console.error('Variáveis de ambiente não configuradas.');

      return respostaJSON({
        success: false,
        message: 'Configuração interna do servidor incompleta.'
      }, 500);
    }

    // Acrescenta a chave somente no servidor.
    // Ela nunca é enviada para o navegador.
    const payload = {
      ...dados,
      apiKey: apiKey
    };

    // Cloudflare chama o Apps Script
    const resposta = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const texto = await resposta.text();

    let resultado;

    try {
      resultado = JSON.parse(texto);
    } catch (erro) {
      console.error('Resposta do Apps Script:', texto);

      return respostaJSON({
        success: false,
        message: 'O servidor de processamento retornou uma resposta inválida.'
      }, 502);
    }

    if (!resultado.success) {
      return respostaJSON({
        success: false,
        message: resultado.message || 'Não foi possível processar o pedido.'
      }, 400);
    }

    return respostaJSON({
      success: true,
      message: 'Pedido enviado com sucesso!'
    }, 200);

  } catch (erro) {
    console.error('Erro em /api/pedido:', erro);

    return respostaJSON({
      success: false,
      message: 'Erro interno ao enviar o pedido.'
    }, 500);
  }
}


function respostaJSON(dados, status = 200) {
  return new Response(
    JSON.stringify(dados),
    {
      status: status,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store'
      }
    }
  );
}
