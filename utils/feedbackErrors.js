function buildAuthFeedback(errors, formType) {
  if (!errors || errors.length === 0) return null;

  const messages = [...new Set(errors.map((e) => e.message).filter(Boolean))];

  let title =
    formType === 'login' ? 'Não foi possível entrar' : 'Não foi possível criar a conta';

  if (messages.some((m) => /já está em uso|já cadastrado/i.test(m))) {
    title = 'E-mail já cadastrado';
  } else if (messages.some((m) => m.includes('incorretos'))) {
    title = 'E-mail ou senha incorretos';
  } else if (errors.some((e) => !e.field && messages.some((m) => m.includes('servidor') || m.includes('Tente novamente')))) {
    title = 'Algo deu errado';
  } else if (messages.length > 1) {
    title = 'Revise os campos abaixo';
  }

  if (messages.length === 1) {
    return {
      title,
      description: messages[0],
      items: null,
    };
  }

  return {
    title,
    description: 'Encontramos os seguintes problemas:',
    items: messages,
  };
}

module.exports = { buildAuthFeedback };
