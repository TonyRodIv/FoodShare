-- Recria Solicitacao (removida acidentalmente) e garante FKs com Doacao/Usuario
-- Doacao + ItemDoacao já existem no banco com schema correto

CREATE TABLE IF NOT EXISTS "Solicitacao" (
    "id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacoes" TEXT,
    "doacaoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitacao_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Solicitacao" ADD CONSTRAINT "Solicitacao_doacaoId_fkey"
    FOREIGN KEY ("doacaoId") REFERENCES "Doacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Solicitacao" ADD CONSTRAINT "Solicitacao_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
