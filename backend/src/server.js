const app = require('./app');

const porta = process.env.PORT || 3000;

const servidor = app.listen(porta, () => {
  console.log(`API ouvindo na porta ${porta}`);
});

// Encerramento gracioso: primeiro o /ready passa a falhar para que o
// orquestrador tire o container do balanceador, depois as conexoes abertas
// terminam antes do processo sair. Sem isso, um deploy derruba requisicoes.
function encerrar(sinal) {
  console.log(`Recebido ${sinal}, encerrando com seguranca.`);
  app.locals.encerrando = true;

  servidor.close(() => {
    console.log('Conexoes finalizadas, saindo.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Tempo esgotado no encerramento, saindo a forca.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));

module.exports = servidor;
