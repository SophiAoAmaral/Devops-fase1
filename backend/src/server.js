const app = require('./app');

const porta = process.env.PORT || 3000;

app.listen(porta, () => {
  console.log(`API ouvindo na porta ${porta}`);
});
