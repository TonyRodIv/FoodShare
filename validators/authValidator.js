const { z } = require('zod');

const registerSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  telefone: z
    .string()
    .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, 'Telefone inválido. Use o formato (11) 91234-5678'),
  role: z.enum(['doador', 'beneficiario'], {
    errorMap: () => ({ message: "Role deve ser 'doador' ou 'beneficiario'" }),
  }),
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'A senha é obrigatória'),
});

module.exports = { registerSchema, loginSchema };
